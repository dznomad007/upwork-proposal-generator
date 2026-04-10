# API 명세

> 모든 API는 Clerk 세션이 필요하다. 미인증 요청은 `401` 반환.
> userId 기준 소유권 검사 — 다른 사용자의 리소스 접근 시 `403`.

---

## 공고 분석 API

### `POST /api/parse-job`
공고 텍스트를 구조화된 `JobPosting`으로 변환한다.

**입력**
```json
{ "rawText": "..." }
```

**출력 (성공)**
```json
{
  "success": true,
  "data": {
    "job": { ...JobPosting },
    "missingInfo": ["예산 정보 없음", "경력 수준 불명확"]
  }
}
```

---

### `POST /api/analyze`
구조화된 프로필 + 공고를 기반으로 분석 결과를 생성한다.

**입력**
```json
{
  "profile": { ...UserProfile },
  "job": { ...JobPosting }
}
```

**출력 (성공)**
```json
{
  "success": true,
  "data": { ...AnalysisResult }
}
```

> MVP에서는 SSE 없이 일반 JSON 응답. 타임아웃: 30초.

---

### `POST /api/scrape`
Upwork URL에서 공고 내용을 가져온다. **보조 기능** — 실패해도 서비스는 정상 동작.

URL은 `upwork.com` 호스트만 허용 (임의 URL fetch 방지).

**구현 방식**: 서버사이드 `fetch()` + HTML 파싱 (Playwright 없음)
- 추출 폴백 체인: `__NEXT_DATA__` → JSON-LD → `<meta>` 태그 → 본문 텍스트
- 차단 감지 시 (captcha, 403, cf-challenge 등) → `fallback: "paste-text"` 반환
- 관련 모듈: `lib/scraping/upwork.ts`

**입력**
```json
{ "url": "https://www.upwork.com/jobs/..." }
```

**출력 (성공)**
```json
{ "success": true, "data": { "rawText": "..." } }
```

**출력 (실패 / 차단)**
```json
{ "success": false, "fallback": "paste-text" }
```

> `export const runtime = 'nodejs'` 명시.

---

## 이력서 / 프로필 API

### `POST /api/resumes/upload`
이력서 파일을 업로드하고 AI로 파싱한다. 동일 파일이면 DB 중복 검사 후 재파싱 없이 반환.

**입력**: `multipart/form-data`
- `file`: PDF 또는 DOCX (최대 10MB)

**처리 흐름**
1. SHA-256 해시 계산
2. `(userId, fileHash)` 중복 조회
3. 중복: 기존 resume + active profile 반환
4. 신규: Vercel Blob 저장 → 텍스트 추출 → AI 파싱 → DB 저장

**출력 (성공)**
```json
{
  "success": true,
  "deduped": false,
  "resumeId": "r_...",
  "profileId": "p_...",
  "profile": { ...UserProfile }
}
```

> `export const runtime = 'nodejs'` 명시 필수 (pdf-parse, mammoth 사용).

---

### `GET /api/resumes`
사용자가 업로드한 이력서 목록을 반환한다.

**출력**
```json
{
  "success": true,
  "data": [{ "id": "r_...", "fileName": "...", "createdAt": "..." }]
}
```

---

### `GET /api/profile/active`
현재 로그인 사용자의 active profile을 반환한다.

**출력 (있음)**
```json
{
  "success": true,
  "data": {
    "id": "p_...",
    "profile": { ...UserProfile },
    "source": "resume_parsed",
    "resumeId": "r_..."
  }
}
```

**출력 (없음)**
```json
{ "success": true, "data": null }
```

---

### `PATCH /api/profile/[id]`
프로필을 수정한다. Autosave에서 호출.

**입력**
```json
{ "profileJson": { ...UserProfile } }
```

**출력**
```json
{ "success": true, "data": { "updatedAt": "..." } }
```

---

### `POST /api/profile/from-resume`
resume의 parsedProfileJson으로 새 profile을 생성한다 ("원본으로 되돌리기").

**입력**
```json
{ "resumeId": "r_..." }
```

**출력**
```json
{
  "success": true,
  "data": { "id": "p_...", "profile": { ...UserProfile } }
}
```

---

## 공통 에러 처리

| 상황 | 응답 |
|------|------|
| 미인증 | `401 Unauthorized` |
| 다른 사용자 리소스 접근 | `403 Forbidden` |
| 입력 검증 실패 | `400 Bad Request` + Zod 에러 메시지 |
| 파일 타입/크기 오류 | `422 Unprocessable Entity` |
| AI 응답 파싱 실패 | 재시도 1회 → 실패 시 `500` |
| 타임아웃 | `/api/scrape` 15초, `/api/analyze` 30초, `/api/resumes/upload` 60초 |
