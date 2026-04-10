# Upwork Proposal Generator

A Next.js web app that generates a **cover letter · fit score · key points · rate guide** from an Upwork job posting and your freelancer profile.

Upload your resume (PDF/DOCX) and the AI will parse and save your profile so you can pick up where you left off on your next visit.

---

## Features

| Feature | Description |
|---------|-------------|
| 📄 Job Input | Paste job text directly or use the bookmarklet to copy from Upwork |
| 🤖 AI Analysis | Generates cover letter, fit score, key points, and rate guide |
| 📁 Resume Upload | Upload PDF/DOCX → AI automatically extracts skills, experience, and projects |
| 💾 Profile Persistence | Auto-saves profile edits on login (500ms debounce) |
| 🌐 KO / EN Toggle | Switches both UI labels and all AI-generated text between Korean and English |
| 🔖 Bookmarklet | One-click copy of Upwork job posting content to clipboard |

---

## Tech Stack

- **Framework**: Next.js 16 + TypeScript + App Router
- **Auth**: [Clerk](https://clerk.com)
- **Database**: PostgreSQL + [Prisma](https://prisma.io)
- **AI**: Anthropic Claude / OpenAI GPT-4o (selected via `AI_PROVIDER` env var)
- **Styling**: Tailwind CSS v3
- **Validation**: Zod
- **Testing**: Vitest (unit) · Playwright (E2E)

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/dznomad007/upwork-proposal-generator.git
cd upwork-proposal-generator
nvm use        # Node 25 (.nvmrc)
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the following values in `.env.local`:

| Variable | Description |
|----------|-------------|
| `AI_PROVIDER` | `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) |
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk Dashboard |
| `DATABASE_URL` | PostgreSQL connection string |

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Start the development server

```bash
npm run dev
# → http://localhost:3000
```

---

## Usage

### Basic flow (no login required)

1. Paste the Upwork job posting content into the **Job Posting** field.
2. Click **Parse Job**.
3. Fill in your skills, experience, and projects in the **Profile** field.
4. Click **Analyze**.
5. Review the cover letter, fit score, key points, and rate guide.

### Bookmarklet (auto-copy job posting)

1. Go to the **Job Posting → Bookmarklet** tab in the app.
2. Drag the 🔖 button to your bookmarks bar, or copy the code and install it manually.
3. On any Upwork job page, click the saved bookmark to copy the content to your clipboard.
4. Return to the app and paste with `Cmd+V` in the **Paste Text** tab.

### Resume upload (login required)

1. After logging in, drag and drop a PDF/DOCX onto the upload area in the **Profile** section, or click to browse.
2. The AI automatically extracts your skills, experience, and projects.
3. Re-uploading the same file returns cached results instantly without re-calling the AI.

---

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Lint
npm test                 # Vitest unit tests
npm run test:e2e         # Playwright E2E tests

npx prisma migrate dev   # Run DB migrations
npx prisma studio        # Open DB GUI
```

---

## Project Structure

```
├── app/
│   ├── page.tsx                  # Main page
│   ├── layout.tsx                # ClerkProvider wrapper
│   └── api/
│       ├── parse-job/            # Job text → structured JSON
│       ├── analyze/              # Profile + job → analysis result
│       ├── scrape/               # URL → job text (fallback)
│       ├── resumes/upload/       # Resume upload + AI parsing
│       └── profile/              # Profile CRUD
├── components/                   # UI components
├── hooks/
│   └── useProfile.ts             # Profile state + autosave
├── lib/
│   ├── ai/                       # AI provider abstraction
│   ├── i18n.ts                   # KO/EN translation dictionary
│   ├── scraping/upwork.ts        # HTML parsing fallback chain
│   └── validation/schemas.ts    # Zod schemas
├── prisma/schema.prisma          # DB schema
└── types/index.ts                # Shared types
```

---

## Switching AI Provider

Just change `AI_PROVIDER` in `.env.local`:

```env
AI_PROVIDER=anthropic   # Use Claude
AI_PROVIDER=openai      # Use GPT-4o
```

---

## License

MIT
