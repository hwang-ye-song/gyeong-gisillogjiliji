// 요청 형식이 바뀌었으므로 수정 후 반드시 다시 배포해야 db.js·step4_allergy.html이 동작함: supabase functions deploy generate-ai-summary
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 아무 글이나 AI에 넘기는 통로가 되지 않도록 정해진 두 가지 요청만, 크기를 제한해서 받음
const MAX_BODY_BYTES = 32 * 1024
const MAX_ENTRIES = 10
const MAX_ENTRIES_BYTES = 20 * 1024
const MAX_TRANSCRIPT_CHARS = 300
const MAX_FIELD_CHARS = 100
const MAX_TOKENS = 1024
const UPSTREAM_TIMEOUT_MS = 14000 // db.js의 AI 대기 시간(15초)보다 짧게
const LANGS = ['ko', 'en', 'zh', 'ru', 'vi', 'ja', 'tl', 'km', 'th', 'mn', 'uz', 'ar']

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v)) ? v as Obj : {}
const list = (v: unknown): unknown[] => Array.isArray(v) ? v : []
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).slice(0, MAX_FIELD_CHARS)
const byteLength = (s: string): number => new TextEncoder().encode(s).length

function json(body: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status },
  )
}

// 보건실 요약 프롬프트 (db.js에서 만들던 문구 그대로)
function buildSummaryPrompt(entries: unknown[]): string {
  const symptomsText = entries.map((item, i) => {
    const e = obj(item)
    const painLevels = obj(e.painLevels)
    const startTimes = obj(e.startTimes)
    const traumaCauses = obj(e.traumaCauses)
    const symptomParts = list(e.symptoms).map(sym => {
      const s = String(sym)
      const p = painLevels[s] ? painLevels[s] : (e.painLevel || 0)
      const t = startTimes[s] ? startTimes[s] : (e.startTime || "모름")
      const tc = traumaCauses[s] ? `, 원인:${str(traumaCauses[s])}` : ''
      return `${str(s)}(통증:${str(p)}/10, 발현:${str(t)}${tc})`
    })
    const sText = symptomParts.join(', ')
    const followupText = list(e.followups).map(f => str(obj(f).q) + ' ' + str(obj(f).a)).join(', ')
    return `[증상 ${i+1}] 부위: ${str(e.part)} ${str(e.partLabel || e.bellyPos || '')}, 증상 및 상태: ${sText}, 기타: ${followupText}`
  }).join('\n')

  const first = obj(entries[0])

  let allergyText = ""
  const allergies = list(first.allergies).filter((a): a is string => typeof a === 'string')
  if (allergies.length > 0 && !allergies.includes('allergy_none')) {
    const allergyMap: Record<string, string> = { "allergy_drug": "약", "allergy_peanut": "땅콩/견과류", "allergy_milk": "우유", "allergy_egg": "계란", "allergy_seafood": "해산물", "allergy_peach": "복숭아", "allergy_wheat": "밀가루", "allergy_idk": "잘 모르겠음(확인 필요)" }
    allergyText = `\n[알레르기 정보]: ${allergies.map(a => str(a.startsWith('custom_') ? a.substring(7) : (allergyMap[a] || a))).join(', ')}`
  }

  let medicationText = ""
  const medications = list(first.medications).filter((m): m is string => typeof m === 'string')
  if (medications.length > 0 && !medications.includes('med_none')) {
    const medMap: Record<string, string> = { "med_cold": "감기약", "med_pain": "진통제", "med_digest": "소화제", "med_hospital": "병원/처방약", "med_idk": "잘 모르겠음" }
    medicationText = `\n[복용 중인 약]: ${medications.map(m => str(medMap[m] || m)).join(', ')}`
  }

  // 과거 방문 기록은 AI 요약에 넣지 않습니다.
  // 이름을 받지 않으면 학년·반·번호만으로는 같은 학생인지 알 수 없어(다른 학교·작년 학생과 섞임) 연결 기능을 뺐습니다.
  return `학생이 선택한 다음 증상들을 바탕으로, 보건 교사가 한눈에 파악할 수 있는 한국어 요약 문장을 2~3줄로 작성해. 병명을 진단하지 말고 의심 조합 규칙에만 기반하여 사실적으로 작성해.${allergyText}${medicationText}\n${symptomsText}`
}

// 음성 알레르기 추출 프롬프트 (step4_allergy.html에서 만들던 문구 그대로, 학생 말은 JSON 문자열 데이터로만 넣음)
function buildAllergyPrompt(transcript: string, lang: string): string {
  return `너는 학생의 말을 듣고 알레르기 원인 물질을 추출 및 번역하는 의료 어시스턴트야.
현재 학생이 사용하는 언어는 ${lang}야.
[규칙]
1. 학생의 음성 인식 결과에서 알레르기 원인 물질을 추출해.
2. 추출된 단어를 학생이 읽을 수 있는 'native'와 보건교사가 읽을 'ko'(한국어) 두 가지 버전으로 작성해.
3. 주의: 만약 학생의 언어(${lang})가 'ko'라면 'native'에도 억지로 외국어로 번역하지 말고 한국어 단어 그대로 똑같이 적어!
4. 반드시 아래와 같은 순수 JSON 배열(Array of Objects) 형태로만 반환해! 다른 말은 절대 쓰지 마. 알레르기 원인이 없으면 빈 배열 [] 반환.
[출력 예시]
- 학생 언어가 'ru'일 때: [{"native": "креветки", "ko": "새우"}]
- 학생 언어가 'ko'일 때: [{"native": "새우", "ko": "새우"}]
학생 말(데이터): ${JSON.stringify(transcript)}`
}

serve(async (req) => {
  // CORS Preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const raw = await req.text()
    if (byteLength(raw) > MAX_BODY_BYTES) return json({ error: 'too_large' }, 400)
    let body: Obj
    try {
      body = obj(JSON.parse(raw))
    } catch (_) {
      return json({ error: 'bad_request' }, 400)
    }

    // 프롬프트는 서버에서만 만듦 (mode: 'summary' | 'allergy_extract')
    let promptText: string
    if (body.mode === 'summary') {
      const entries = body.entries
      if (!Array.isArray(entries) || entries.length === 0 || entries.length > MAX_ENTRIES ||
          byteLength(JSON.stringify(entries)) > MAX_ENTRIES_BYTES) {
        return json({ error: 'bad_entries' }, 400)
      }
      promptText = buildSummaryPrompt(entries)
    } else if (body.mode === 'allergy_extract') {
      const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
      if (!transcript || transcript.length > MAX_TRANSCRIPT_CHARS) {
        return json({ error: 'bad_transcript' }, 400)
      }
      const reqLang = body.lang
      const lang = typeof reqLang === 'string' && LANGS.includes(reqLang) ? reqLang : 'ko'
      promptText = buildAllergyPrompt(transcript, lang)
    } else {
      return json({ error: 'unknown_mode' }, 400)
    }

    // Supabase Secrets에서 안전하게 꺼내옵니다.
    const apiKey = Deno.env.get('RUNYOUR_AI_API_KEY')

    if (!apiKey) {
      throw new Error('API Key is missing in environment variables.')
    }

    const response = await fetch('https://api.runyour.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gemini/gemini-3.5-flash",
        messages: [{ role: "user", content: promptText }],
        max_tokens: MAX_TOKENS
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    })

    // AI 서버 오류는 상태 코드만 그대로 전달 (응답 내용은 넘기지 않음)
    if (!response.ok) {
      console.error('Upstream error:', response.status)
      await response.body?.cancel()
      return json({ error: 'ai_error' }, response.status)
    }

    const data = await response.json().catch(() => null)
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      console.error('Upstream returned empty content')
      return json({ error: 'ai_empty' }, 502)
    }

    // 호출하는 쪽이 읽는 형식(choices[0].message.content)만 돌려줌
    return json({ choices: [{ message: { content } }] })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('generate-ai-summary error:', message)
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    return json({ error: timedOut ? 'ai_timeout' : 'internal_error' }, timedOut ? 504 : 500)
  }
})
