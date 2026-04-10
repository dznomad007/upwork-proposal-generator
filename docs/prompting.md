# AI 프롬프팅 전략

## 분리 원칙

AI 호출을 3단계로 분리한다.

1. **이력서 파싱** (`/api/resumes/upload`): 이력서 텍스트 → 구조화된 `UserProfile` JSON
2. **공고 파싱** (`/api/parse-job`): 공고 텍스트 → 구조화된 `JobPosting` JSON
3. **분석 생성** (`/api/analyze`): 구조화된 데이터 → `AnalysisResult` JSON

분리하는 이유:
- JSON 파싱 실패 범위를 줄인다
- 사용자가 중간 결과를 수정할 수 있다
- 디버깅이 쉽다

---

## 이력서 파싱 프롬프트 (`/api/resumes/upload`)

**시스템**
```
You are a resume parser. Extract structured profile information from resume text.
Return ONLY valid JSON with no markdown, no code blocks, no extra text.
Extract skills, experience summary, notable projects, availability hints, and hourly rate if mentioned.
If a field cannot be determined, use an empty string or omit optional fields.
```

**유저**
```
Parse this resume and return structured JSON:

[resumeText]

Return this exact schema:
{
  "skills": "comma-separated technical skills",
  "experience": "2-4 sentence summary of work history and key roles",
  "projects": "2-3 notable projects with tech stack and impact",
  "availability": "string if mentioned (optional)",
  "hourlyRate": { "min": number|null, "max": number|null }
}
```

> `preferredLanguage`는 이력서에서 파악하지 않는다. 기존 설정값을 유지한다.
> `hourlyRate`에서 숫자를 찾지 못하면 `null`을 반환한다. 훅에서 `null → undefined`로 변환.

---

## 공고 파싱 프롬프트 (`/api/parse-job`)

**시스템**
```
You are a job posting parser. Extract structured information from raw Upwork job postings.
Return ONLY valid JSON matching the JobPosting schema.
If a field cannot be determined, omit it or use null.
List any fields that are missing or ambiguous in "missingInfo".
```

**유저**
```
Parse this job posting and return structured JSON:

[rawText]

Return this exact schema:
{
  "job": { ...JobPosting fields },
  "missingInfo": ["list of missing/ambiguous fields"]
}
```

---

## 분석 프롬프트 (`/api/analyze`)

**시스템**
```
You are an expert Upwork proposal strategist.
Analyze the match between a freelancer profile and a job posting.
Return ONLY valid JSON. Never fabricate experience the freelancer doesn't have.
Always include assumptions made and information that was missing.
```

**유저**
```
## FREELANCER PROFILE
Skills: [skills]
Experience: [experience]
Projects: [projects]
Availability: [availability]
Target Rate: $[min]–$[max]/hr
Preferred Language: [ko|en]

## JOB POSTING
Title: [title]
Budget: [budget]
Required Skills: [skills]
Description: [description]

---
Return this exact JSON schema:
{
  "coverLetter": "...",
  "fitScore": { ... },
  "keyPoints": [...],
  "rateGuide": { ... },
  "assumptions": ["..."],
  "missingInfo": ["..."],
  "confidence": 0–100
}
```

---

## 커버레터 규칙

- 분량: 120~220단어
- 첫 문장은 공고와 직접 연결 (일반적 자기소개 금지)
- 기술 매칭 2~3개 구체적으로 언급
- 관련 프로젝트나 성과를 수치/결과로 반영
- 마지막은 짧은 CTA로 마무리
- `preferredLanguage`가 `ko`면 한국어, `en`이면 영어로 작성

---

## AI 출력 규칙

- 과장 표현 금지 ("excellent", "passionate" 등)
- 사용자 경력에 없는 내용 작성 금지
- 누락 정보가 있으면 `missingInfo`에 명시
- 견적 추천에는 반드시 `reasoning` 포함
- `confidence`는 정보 충분도에 따라 0~100으로 정직하게 산정

---

## JSON 파싱 실패 처리

1. Zod `safeParse`로 검증
2. 실패 시 재시도 1회 (프롬프트에 "Return ONLY valid JSON, no markdown" 추가)
3. 2회 실패 시 `500` 반환 + 원문 응답 로그 보존
