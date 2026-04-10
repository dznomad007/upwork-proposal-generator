# Upwork Proposal Generator

Upwork 채용 공고와 내 프로필을 입력하면 AI가 **커버레터 · 적합도 점수 · 강조 포인트 · 견적 가이드**를 자동으로 생성해주는 Next.js 웹 앱.

이력서(PDF/DOCX)를 업로드하면 AI가 프로필을 구조화해 저장하고, 다음 방문 시에도 이어 쓸 수 있습니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 📄 공고 분석 | 텍스트 붙여넣기 또는 북마클릿으로 Upwork 공고 내용 입력 |
| 🤖 AI 분석 | 커버레터 · 적합도 점수 · 강조 포인트 · 견적 가이드 생성 |
| 📁 이력서 업로드 | PDF/DOCX 업로드 → AI가 스킬/경력/프로젝트 자동 추출 |
| 💾 프로필 저장 | 로그인 시 프로필 자동 저장 · 수정 (500ms debounce autosave) |
| 🌐 KO / EN 전환 | UI 라벨 + AI 생성 텍스트 전체를 한국어/영어로 전환 |
| 🔖 북마클릿 | Upwork 공고 페이지에서 클릭 한 번으로 내용 클립보드 복사 |

---

## 기술 스택

- **Framework**: Next.js 16 + TypeScript + App Router
- **Auth**: [Clerk](https://clerk.com)
- **Database**: PostgreSQL + [Prisma](https://prisma.io)
- **AI**: Anthropic Claude / OpenAI GPT-4o (`AI_PROVIDER` 환경변수로 선택)
- **Styling**: Tailwind CSS v3
- **Validation**: Zod
- **Testing**: Vitest (unit) · Playwright (E2E)

---

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/dznomad007/upwork-proposal-generator.git
cd upwork-proposal-generator
nvm use        # Node 25 (.nvmrc)
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열어 아래 값을 채웁니다:

| 변수 | 설명 |
|------|------|
| `AI_PROVIDER` | `anthropic` 또는 `openai` |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) |
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk Dashboard |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |

### 3. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev
```

### 4. 개발 서버 실행

```bash
npm run dev
# → http://localhost:3000
```

---

## 사용 방법

### 기본 흐름 (로그인 불필요)

1. **채용 공고** 입력란에 Upwork 공고 내용을 붙여넣습니다.
2. **공고 구조화** 버튼을 클릭합니다.
3. **프로필** 입력란에 스킬 · 경력 · 프로젝트를 입력합니다.
4. **분석 시작** 버튼을 클릭합니다.
5. 커버레터 · 적합도 · 강조 포인트 · 견적 가이드 결과를 확인합니다.

### 북마클릿 (공고 자동 복사)

1. 앱 상단 **채용 공고 → 북마클릿 탭**으로 이동합니다.
2. 🔖 버튼을 북마크바로 드래그하거나 코드를 복사해 수동 설치합니다.
3. Upwork 공고 페이지에서 저장한 북마크를 클릭하면 내용이 클립보드에 복사됩니다.
4. 앱으로 돌아와 **텍스트 붙여넣기** 탭에서 `Cmd+V`로 붙여넣습니다.

### 이력서 업로드 (로그인 필요)

1. 로그인 후 **프로필** 영역의 업로드 영역에 PDF/DOCX를 드래그하거나 클릭합니다.
2. AI가 스킬 · 경력 · 프로젝트를 자동 추출합니다.
3. 동일 파일 재업로드 시 AI 재호출 없이 캐시에서 즉시 반환됩니다.

---

## 주요 명령어

```bash
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드
npm run lint             # 린트
npm test                 # Vitest 단위 테스트
npm run test:e2e         # Playwright E2E 테스트

npx prisma migrate dev   # DB 마이그레이션
npx prisma studio        # DB GUI
```

---

## 프로젝트 구조

```
├── app/
│   ├── page.tsx                  # 메인 페이지
│   ├── layout.tsx                # ClerkProvider
│   └── api/
│       ├── parse-job/            # 공고 텍스트 → 구조화 JSON
│       ├── analyze/              # 프로필 + 공고 → 분석 결과
│       ├── scrape/               # URL → 공고 텍스트 (보조)
│       ├── resumes/upload/       # 이력서 업로드 + AI 파싱
│       └── profile/              # 프로필 CRUD
├── components/                   # UI 컴포넌트
├── hooks/
│   └── useProfile.ts             # 프로필 상태 + autosave
├── lib/
│   ├── ai/                       # AI 프로바이더 추상화
│   ├── i18n.ts                   # KO/EN 번역 딕셔너리
│   ├── scraping/upwork.ts        # HTML 파싱 폴백 체인
│   └── validation/schemas.ts    # Zod 스키마
├── prisma/schema.prisma          # DB 스키마
└── types/index.ts                # 공통 타입
```

---

## AI 프로바이더 전환

`.env.local`의 `AI_PROVIDER` 값만 바꾸면 됩니다.

```env
AI_PROVIDER=anthropic   # Claude 사용
AI_PROVIDER=openai      # GPT-4o 사용
```

---

## 라이선스

MIT
