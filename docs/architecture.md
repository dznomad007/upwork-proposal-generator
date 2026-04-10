# Architecture

## 프로젝트 구조

```text
job-search/
├── .env.local
├── .env.example
├── middleware.ts                     # Clerk 인증 미들웨어
├── prisma/
│   └── schema.prisma                 # DB 스키마
├── app/
│   ├── layout.tsx                    # ClerkProvider 래핑
│   ├── page.tsx
│   ├── globals.css
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   └── api/
│       ├── parse-job/route.ts        # 공고 텍스트 → 구조화 JSON
│       ├── analyze/route.ts          # 프로필 + 공고 → 분석 결과
│       ├── scrape/route.ts           # URL → 공고 텍스트 (보조)
│       ├── resumes/
│       │   ├── upload/route.ts       # 이력서 업로드, 해시 중복 검사, AI 파싱
│       │   └── route.ts              # 이력서 목록 조회
│       └── profile/
│           ├── active/route.ts       # 현재 active profile 조회
│           ├── [id]/route.ts         # 프로필 수정 (PATCH, autosave)
│           └── from-resume/route.ts  # resume 원본 → 새 profile 생성
├── components/
│   ├── ProfileForm.tsx               # 이력서 업로드 + 텍스트 입력
│   ├── JobInputSection.tsx
│   ├── JobPreviewCard.tsx
│   ├── ResultPanel.tsx
│   ├── CoverLetter.tsx
│   ├── FitScore.tsx
│   ├── KeyPoints.tsx
│   └── RateGuide.tsx
├── hooks/
│   ├── useProfile.ts                 # 서버 기반 프로필 상태 + autosave
│   └── useScrape.ts
├── lib/
│   ├── ai/
│   │   ├── provider.ts               # AIProvider 인터페이스
│   │   ├── index.ts                  # getAIProvider() 팩토리
│   │   ├── prompts.ts                # 모든 프롬프트 (공고 파싱, 이력서 파싱, 분석)
│   │   └── providers/
│   │       ├── anthropic.ts
│   │       └── openai.ts
│   ├── prisma.ts                     # Prisma 클라이언트 싱글톤
│   └── validation/
│       └── schemas.ts                # Zod 스키마
└── types/
    └── index.ts
```

---

## DB 모델 (Prisma)

```prisma
model User {
  id        String    @id @default(cuid())
  clerkId   String    @unique
  email     String    @unique
  name      String?
  resumes   Resume[]
  profiles  Profile[]
  createdAt DateTime  @default(now())
}

model Resume {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  fileName          String
  fileHash          String                        // SHA-256
  mimeType          String
  storageKey        String                        // Vercel Blob key
  rawText           String    @db.Text
  parsedProfileJson Json                          // AI 파싱 원본 (불변)
  parseStatus       String    @default("done")   // "done" | "failed"
  createdAt         DateTime  @default(now())
  profiles          Profile[]

  @@unique([userId, fileHash])                   // 중복 업로드 방지
}

model Profile {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  resumeId    String?
  resume      Resume?   @relation(fields: [resumeId], references: [id])
  profileJson Json                               // 사용자 편집본 (autosave)
  source      String    @default("manual")       // "resume_parsed" | "manual" | "hybrid"
  isActive    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**핵심 규칙**:
- `resumes.parsedProfileJson` = AI 파싱 원본 (덮어쓰지 않음)
- `profiles.profileJson` = 사용자가 편집하는 현재본 (autosave)
- `(userId, fileHash)` 중복 시 AI 재호출 없이 기존 데이터 반환

---

## 핵심 타입

```ts
// types/index.ts
export interface UserProfile {
  skills: string;
  experience: string;
  projects: string;
  availability?: string;
  hourlyRate?: { min?: number; max?: number };
  preferredLanguage: "ko" | "en";
}

export interface JobPosting {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel?: string;
  projectLength?: string;
  weeklyHours?: string;
  budget?: {
    type: "hourly" | "fixed" | "unknown";
    min?: number;
    max?: number;
    amount?: number;
    currency?: string;
  };
  clientInfo?: {
    location?: string;
    rating?: number;
    totalSpent?: string;
    paymentVerified?: boolean;
    jobsPosted?: number;
  };
  sourceUrl?: string;
  rawText?: string;
}

export interface AnalysisResult {
  coverLetter: string;
  fitScore: {
    overall: number;
    breakdown: { skills: number; experience: number; availability: number };
    matchedSkills: string[];
    missingSkills: string[];
  };
  keyPoints: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  rateGuide: {
    recommended?: number;
    range?: { min?: number; max?: number };
    strategy: string;
    reasoning: string;
  };
  assumptions: string[];
  missingInfo: string[];
  confidence: number;
}
```

---

## 데이터 플로우

```
[인증]
  Clerk 로그인 → userId 확보

[프로필 로드]
  GET /api/profile/active → DB에서 active profile 반환
  → 없으면 빈 폼 표시

[이력서 업로드]
  파일 선택 → POST /api/resumes/upload
    → SHA-256 해시 계산
    → (userId, fileHash) 중복 조회
        → 히트: 기존 profile 반환 (AI 재호출 없음)
        → 미스: Vercel Blob 저장 → 텍스트 추출 → AI 파싱
                → Resume + Profile DB 저장 → 반환

[프로필 수동 수정]
  textarea 입력 → 500ms debounce
  → PATCH /api/profile/:id → DB 저장

[공고 분석]
  UserProfile + JobPosting → POST /api/analyze
    → AnalysisResult JSON 반환
```
