# CLAUDE.md

## 프로젝트 개요
채용 공고 텍스트와 사용자 프로필을 입력받아, **커버레터 + 적합도 점수 + 강조 포인트 + 견적 가이드**를 자동 생성하는 Next.js 웹 앱.
이력서(PDF/DOCX)를 업로드하면 AI가 프로필을 구조화하고 서버에 저장해 재방문 시에도 이어 쓸 수 있다.

> 핵심 원칙: **URL 스크래핑 없이도 텍스트 붙여넣기만으로 항상 동작**해야 한다.

---

## 기술 스택
- **프레임워크**: Next.js 14 + TypeScript + App Router
- **인증**: Clerk (`@clerk/nextjs`)
- **DB**: PostgreSQL + Prisma
- **AI**: `@anthropic-ai/sdk` / `openai` — `AI_PROVIDER` 환경변수로 선택
- **스타일링**: Tailwind CSS v3
- **검증**: Zod

---

## 주요 명령어

```bash
npm run dev            # 개발 서버 시작 (http://localhost:3000)
npm run build          # 프로덕션 빌드
npm run lint           # 린트 검사
npx prisma migrate dev # DB 마이그레이션
npx prisma studio      # DB GUI
```

---

## 환경 변수 (`.env.local`)

```env
# AI 프로바이더 (anthropic | openai)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=2000
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2000

# Clerk 인증
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database
DATABASE_URL=postgresql://...

# 스크래핑 (보조 기능)
SCRAPING_TIMEOUT_MS=15000
SCRAPING_HEADLESS=true
```

> AI 모델명은 코드에 하드코딩하지 않고 반드시 환경 변수로 관리한다.

---

## 범위 요약

**포함**: 공고 텍스트 붙여넣기, 이력서 업로드, 프로필 저장(DB), 로그인, AI 분석, 결과 복사
**제외**: Cloudflare 우회 스크래핑, proposal 자동 제출, 브라우저 확장

→ 상세: [docs/mvp-scope.md](docs/mvp-scope.md)

---

## 주요 제약사항

1. **스크래핑은 보조 기능** — 핵심 흐름(`/api/parse-job`, `/api/analyze`)과 결합하지 않는다.
2. **AI는 항상 근거와 가정을 포함** — `assumptions`, `missingInfo`, `confidence` 필드 필수.
3. **SSE 대신 일반 JSON 응답** — 스트리밍은 이후 단계에서 추가.
4. **Node.js 전용 API 라우트** — pdf-parse, mammoth, Playwright 사용 시 `runtime = 'nodejs'` 명시.
5. **커버레터 분량**: 120~220단어, 첫 문장은 공고와 직접 연결.
6. **이력서 중복 파싱 방지** — `(userId, fileHash)` 기준으로 DB 중복 체크, 동일 파일이면 AI 재호출 없음.
7. **프로필 원본/편집본 분리** — `resumes.parsedProfileJson`(원본)과 `profiles.profileJson`(편집본)을 별도로 관리한다.

---

## 구현 순서

1. ✅ 기본 앱 세팅 (Next.js, Tailwind, Zod, 타입 정의)
2. ✅ 텍스트 기반 MVP 완성 (`/api/parse-job` → `/api/analyze` → UI)
3. ✅ AI 프로바이더 추상화 (Anthropic/OpenAI 전환 가능)
4. 인증 + DB 세팅 (Clerk, Prisma, PostgreSQL)
5. 이력서 업로드 API + 프로필 저장/조회 API
6. 프론트엔드 `useProfile` 훅 + ProfileForm 업데이트
7. URL 자동 채우기 추가 (Playwright `/api/scrape`)
8. 선택 개선 (스트리밍, 프롬프트 튜닝)

---

## Reference 문서

- [docs/architecture.md](docs/architecture.md) — 프로젝트 구조, 타입, DB 모델, 데이터 플로우
- [docs/api.md](docs/api.md) — API 라우트 입출력 명세
- [docs/prompting.md](docs/prompting.md) — AI 프롬프팅 전략 및 규칙
- [docs/ui.md](docs/ui.md) — UI 레이아웃 및 컴포넌트 설계
- [docs/mvp-scope.md](docs/mvp-scope.md) — 범위, 성공 기준, 검증 시나리오
