// Supabase 설정
const supabaseUrl = 'https://cldztqptvribbiyisoju.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZHp0cXB0dnJpYmJpeWlzb2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDIwNDUsImV4cCI6MjA5OTUxODA0NX0.k4jMLJMYXRgmSQ0RxwgZzC-1UkM7wJSG3ZJpqLp5rRo';

// Supabase 클라이언트 초기화
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

// 백그라운드 동기화 큐 처리
async function processSyncQueue() {
  let queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
  console.log("processSyncQueue: queue length = ", queue.length);
  if (queue.length === 0) return;

  while (queue.length > 0) {
    let record = queue[0];
    console.log("processSyncQueue: processing record", record);

    // 1. AI 요약이 없으면 생성
    if (!record.ai_summary) {
      try {
        console.log("processSyncQueue: generating AI summary");
        const symptomsText = record.entries_json.map((e, i) => {
          let symptomParts = [];
          if (e.symptoms && e.symptoms.length > 0) {
            e.symptoms.forEach(s => {
              const p = e.painLevels && e.painLevels[s] ? e.painLevels[s] : (e.painLevel || 0);
              const t = e.startTimes && e.startTimes[s] ? e.startTimes[s] : (e.startTime || "모름");
              symptomParts.push(`${s}(통증:${p}/10, 발현:${t})`);
            });
          }
          const sText = symptomParts.join(', ');
          return `[증상 ${i+1}] 부위: ${e.part} ${e.bellyPos || ''}, 증상 및 상태: ${sText}, 기타: ${e.followups.map(f => f.q + ' ' + f.a).join(', ')}`;
        }).join('\n');
        
        let allergyText = "";
        const allergies = record.entries_json[0] && record.entries_json[0].allergies;
        if (allergies && allergies.length > 0 && !allergies.includes('allergy_none')) {
          const allergyMap = { "allergy_drug": "약", "allergy_peanut": "땅콩/견과류", "allergy_milk": "우유", "allergy_egg": "계란", "allergy_seafood": "해산물", "allergy_peach": "복숭아", "allergy_wheat": "밀가루" };
          allergyText = `\n[알레르기 정보]: ${allergies.map(a => allergyMap[a] || a).join(', ')}`;
        }

        const promptText = `학생이 선택한 다음 증상들을 바탕으로, 보건 교사가 한눈에 파악할 수 있는 한국어 요약 문장을 2~3줄로 작성해. 병명을 진단하지 말고 의심 조합 규칙에만 기반하여 사실적으로 작성해.${allergyText}\n${symptomsText}`;

        /* ===== [방법 2] Supabase Edge Function을 이용한 안전한 호출 =====
         * API Key가 노출되지 않도록 서버리스 함수에서 처리합니다.
         */
        console.log("processSyncQueue: calling db.functions.invoke");
        const { data, error } = await db.functions.invoke('generate-ai-summary', {
          body: { promptText: promptText }
        });
        console.log("processSyncQueue: invoke result", { data, error });

        if (error) {
          record.ai_summary = `Edge Function 오류: ${error.message}`;
          console.error("Edge Function Error:", error);
        } else if (data && data.choices && data.choices.length > 0) {
          record.ai_summary = data.choices[0].message.content;
        } else {
          record.ai_summary = `API 응답 오류: ${JSON.stringify(data)}`;
        }
      } catch (e) {
        console.error(e);
        record.ai_summary = `네트워크/시스템 오류: ${e.message}`;
      }
    }

    // 2. DB에 저장
    try {
      // 레거시 호환성: 로컬 스토리지에 남아있는 구버전 큐 데이터의 top-level allergies를 내부로 이동하고 삭제
      if (record.allergies !== undefined) {
        if (record.entries_json && record.entries_json.length > 0) {
          record.entries_json[0].allergies = record.allergies;
        }
        delete record.allergies;
      }

      console.log("processSyncQueue: inserting into DB", record);
      const { error } = await db.from('surveys').insert([record]);
      if (error) throw error;
      
      console.log("processSyncQueue: DB insert success");
      // DB 저장 성공 시 큐에서 제거
      queue.shift();
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch (e) {
      console.error("Supabase Sync Failed, will retry later:", e);
      break; // 실패 시 루프 중단 (다음에 다시 시도)
    }
  }
}

// 스크립트 로드 시 자동으로 큐 처리 시작
document.addEventListener('DOMContentLoaded', processSyncQueue);
