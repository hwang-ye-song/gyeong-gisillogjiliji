// Supabase 설정
const supabaseUrl = 'https://cldztqptvribbiyisoju.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZHp0cXB0dnJpYmJpeWlzb2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDIwNDUsImV4cCI6MjA5OTUxODA0NX0.k4jMLJMYXRgmSQ0RxwgZzC-1UkM7wJSG3ZJpqLp5rRo';

// Supabase 클라이언트 초기화 (CDN 스크립트를 못 불러왔으면 null)
const db = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// AI 요약 응답을 기다리는 최대 시간 (넘으면 기본 요약으로 저장)
const AI_TIMEOUT_MS = 15000;

// 로컬 큐 읽기 (처리 중에도 step5에서 새 기록이 추가될 수 있어 쓰기 직전마다 새로 읽음)
function readQueue() {
  try {
    const q = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    return Array.isArray(q) ? q.filter(r => r && typeof r === 'object') : [];
  } catch (e) {
    return [];
  }
}

// 기록 구분용 키: step5에서 만든 local_id (예전 기록은 created_at)
function queueKey(r) {
  return r.local_id || r.created_at;
}

// 큐에 남아 있는 해당 기록에 값 저장 (AI 요약 등)
function saveQueued(key, patch) {
  try {
    const q = readQueue();
    const i = q.findIndex(r => queueKey(r) === key);
    if (i >= 0) {
      Object.assign(q[i], patch);
      localStorage.setItem('sync_queue', JSON.stringify(q));
    }
  } catch (e) {
    console.error("saveQueued failed:", e.message); // 저장 공간 부족 등: 전송은 그대로 진행
  }
}

// 해당 기록만 큐에서 제거
function removeFromQueue(key) {
  localStorage.setItem('sync_queue', JSON.stringify(readQueue().filter(r => queueKey(r) !== key)));
}

// 다시 보내도 계속 실패할 기록은 'sync_dead'로 옮겨 보관 (지우지 않음)
function moveToDead(key, reason) {
  const q = readQueue();
  const rec = q.find(r => queueKey(r) === key);
  if (!rec) return;
  let dead;
  try {
    dead = JSON.parse(localStorage.getItem('sync_dead') || '[]');
  } catch (e) {
    dead = null;
  }
  if (!Array.isArray(dead)) return; // 보관함이 깨져 있으면 옮기지 않고 큐에 그대로 둠
  rec.sync_error = reason;
  dead.push(rec);
  localStorage.setItem('sync_dead', JSON.stringify(dead));
  localStorage.setItem('sync_queue', JSON.stringify(q.filter(r => queueKey(r) !== key)));
}

// 네트워크 끊김(0)·서버 오류(5xx)·시간 초과(408)·요청 과다(429)는 나중에 재시도.
// 키·권한(401/403)·테이블 없음(404)·컬럼 없음(PGRST204) 같은 설정 문제도 모든 기록에 똑같이 생기므로 재시도
// (설정을 고치면 다시 보내짐). 그 기록만의 문제(값 형식 오류 등)일 때만 'sync_dead'로 옮김
function isPermanentError(status, code) {
  if (!status || status >= 500 || [401, 403, 404, 408, 429].includes(status)) return false;
  if (['PGRST204', 'PGRST205', '42501', '42P01'].includes(code)) return false;
  return status >= 400;
}

// 백그라운드 동기화 큐 처리
async function processSyncQueue() {
  if (!db) return;
  // 시작할 때 있던 기록만 차례로 처리 (도중에 추가된 기록은 다음 실행 때 처리)
  const keys = readQueue().map(queueKey);
  if (keys.length === 0) return;
  console.log("processSyncQueue: queue length = ", keys.length);

  for (const key of keys) {
    // 매번 새로 읽음 (다른 탭·이전 실행에서 이미 보냈으면 건너뜀)
    const record = readQueue().find(r => queueKey(r) === key);
    if (!record) continue;
    console.log("processSyncQueue: processing record");

    // 레거시 호환성: 로컬 스토리지에 남아있는 구버전 큐 데이터 정리 (AI 요약에 알레르기가 들어가도록 먼저 처리)
    if (record.allergies !== undefined) {
      if (record.entries_json && record.entries_json.length > 0) {
        record.entries_json[0].allergies = record.allergies;
      }
      delete record.allergies;
    }
    delete record.student_name; // 이름은 더 이상 받지 않음 (구버전 기록에만 남아 있음)
    if (record.is_resolved === undefined) record.is_resolved = false;

    // 1. AI 요약이 없으면 생성
    if (!record.ai_summary) {
      let symptomsText = '';
      let allergyText = '';
      let medicationText = '';
      try {
        console.log("processSyncQueue: generating AI summary");
        // AI 프롬프트는 Edge Function(mode: 'summary')에서 만듦. 아래 텍스트는 AI 실패 시 기본 요약용
        symptomsText = record.entries_json.map((e, i) => {
          let symptomParts = [];
          if (e.symptoms && e.symptoms.length > 0) {
            e.symptoms.forEach(s => {
              const p = e.painLevels && e.painLevels[s] ? e.painLevels[s] : (e.painLevel || 0);
              const t = e.startTimes && e.startTimes[s] ? e.startTimes[s] : (e.startTime || "모름");
              const tc = e.traumaCauses && e.traumaCauses[s] ? `, 원인:${e.traumaCauses[s]}` : '';
              symptomParts.push(`${s}(통증:${p}/10, 발현:${t}${tc})`);
            });
          }
          const sText = symptomParts.join(', ');
          return `[증상 ${i+1}] 부위: ${e.part} ${e.partLabel || e.bellyPos || ''}, 증상 및 상태: ${sText}, 기타: ${(e.followups || []).map(f => f.q + ' ' + f.a).join(', ')}`;
        }).join('\n');
        
        allergyText = "";
        const allergies = record.entries_json[0] && record.entries_json[0].allergies;
        if (allergies && allergies.length > 0 && !allergies.includes('allergy_none')) {
          const allergyMap = { "allergy_drug": "약", "allergy_peanut": "땅콩/견과류", "allergy_milk": "우유", "allergy_egg": "계란", "allergy_seafood": "해산물", "allergy_peach": "복숭아", "allergy_wheat": "밀가루", "allergy_idk": "잘 모르겠음(확인 필요)" };
          allergyText = `\n[알레르기 정보]: ${allergies.map(a => a.startsWith('custom_') ? a.substring(7) : (allergyMap[a] || a)).join(', ')}`;
        }

        medicationText = "";
        const medications = record.entries_json[0] && record.entries_json[0].medications;
        if (medications && medications.length > 0 && !medications.includes('med_none')) {
          const medMap = { "med_cold": "감기약", "med_pain": "진통제", "med_digest": "소화제", "med_hospital": "병원/처방약", "med_idk": "잘 모르겠음" };
          medicationText = `\n[복용 중인 약]: ${medications.map(m => medMap[m] || m).join(', ')}`;
        }

        /* ===== [방법 2] Supabase Edge Function을 이용한 안전한 호출 =====
         * API Key가 노출되지 않도록 서버리스 함수에서 처리합니다.
         * 과거 방문 기록은 AI 요약에 넣지 않습니다 (프롬프트는 Edge Function 참고).
         */
        console.log("processSyncQueue: calling db.functions.invoke");
        let timer;
        const { data, error } = await Promise.race([
          db.functions.invoke('generate-ai-summary', {
            body: { mode: 'summary', entries: record.entries_json }
          }),
          // 응답이 너무 늦으면 기본 요약으로 넘어감 (요청 자체는 취소되지 않음)
          new Promise(resolve => {
            timer = setTimeout(() => resolve({ data: null, error: new Error('AI timeout') }), AI_TIMEOUT_MS);
          })
        ]);
        clearTimeout(timer);
        console.log("processSyncQueue: invoke result", { ok: !error });

        const content = data && data.choices && data.choices.length > 0 && data.choices[0].message ? data.choices[0].message.content : null;
        if (error) {
          console.error("Edge Function Error:", error);
          const reason = error.message === 'AI timeout' ? 'AI 응답 지연' : 'AI 서버 연결 실패';
          record.ai_summary = `[기본 요약(${reason})]\n${symptomsText}${allergyText}${medicationText}`;
        } else if (typeof content === 'string' && content.trim()) {
          record.ai_summary = content;
          // 페이지가 바뀌거나 DB 저장이 실패해도 AI를 다시 부르지 않도록 큐에 바로 저장
          saveQueued(key, { ai_summary: content });
        } else if (data && data.error) {
          // 크레딧 소진·키 오류·모델 오류 등 원인이 여러 가지라 구체적으로 단정하지 않음
          console.error("API Error:", data.error);
          record.ai_summary = `[기본 요약(AI 오류)]\n${symptomsText}${allergyText}${medicationText}`;
        } else {
          console.error("Unexpected AI response (empty content)");
          record.ai_summary = `[기본 요약(AI 응답 없음)]\n${symptomsText}${allergyText}${medicationText}`;
        }
      } catch (e) {
        console.error(e);
        record.ai_summary = `[기본 요약(네트워크 오류)]\n${symptomsText}${allergyText}${medicationText}`;
      }
    }

    // 2. DB에 저장 (local_id·sync_error는 surveys 컬럼이 아니므로 빼고 보냄)
    const { local_id, sync_error, ...row } = record;
    let res;
    try {
      console.log("processSyncQueue: inserting into DB");
      res = await db.from('surveys').insert([row]);
    } catch (e) {
      console.error("Supabase Sync Failed, will retry later:", e.message);
      break; // 실패 시 루프 중단 (다음에 다시 시도)
    }

    if (!res.error) {
      console.log("processSyncQueue: DB insert success");
      // DB 저장 성공 시 큐를 새로 읽어 이 기록만 제거 (처리 중에 추가된 기록이 지워지지 않게)
      removeFromQueue(key);
      continue;
    }

    console.error("Supabase Sync Failed:", res.status, res.error.code, res.error.message);
    if (isPermanentError(res.status, res.error.code)) {
      // 이 기록이 계속 실패해 뒤 기록까지 막지 않도록 'sync_dead'로 옮기고 다음 기록 진행
      moveToDead(key, `${res.status} ${res.error.code || ''} ${res.error.message || ''}`);
      continue;
    }
    break; // 네트워크·서버 오류: 나중에 다시 시도
  }
}

// 같은 탭에서 겹쳐 실행되지 않게, 다른 탭이 처리 중이면 건너뜀
let isSyncing = false;
async function runSync() {
  if (isSyncing || !db) return;
  isSyncing = true;
  try {
    if (navigator.locks) {
      await navigator.locks.request('sync_queue', { ifAvailable: true }, lock => lock ? processSyncQueue() : null);
    } else {
      await processSyncQueue();
    }
  } catch (e) {
    console.error("processSyncQueue error:", e.message);
  } finally {
    isSyncing = false;
  }
}

// 스크립트 로드 시 자동으로 큐 처리 시작, 네트워크가 돌아오면·1분마다 다시 시도
document.addEventListener('DOMContentLoaded', runSync);
window.addEventListener('online', runSync);
setInterval(runSync, 60000);
