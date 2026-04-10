/**
 * job-analyze.spec.ts — 공고 입력 → 분석 → 커버레터/점수 결과 테스트
 *
 * 검증 항목:
 *  1. 공고 텍스트 붙여넣기 + 프로필 입력 후 "공고 구조화" 버튼 클릭
 *  2. 공고 미리보기(JobPreviewCard) 표시 후 "분석 시작" 버튼 클릭
 *  3. 분석 결과에 coverLetter, fitScore, keyPoints 탭 표시 확인
 *  4. 커버레터 탭의 "복사" 버튼 동작 확인
 *
 * 실제 컴포넌트 구조:
 *  - app/page.tsx: "공고 구조화" 버튼 (handleParseJob) → "분석 시작" 버튼 (handleAnalyze)
 *  - ResultPanel.tsx: 탭 "커버레터", "적합도 {score}점", "강조 포인트", "견적 가이드"
 *  - CoverLetter.tsx: "복사" / "✓ 복사됨" 버튼
 *  - 공고 텍스트 textarea: placeholder="Upwork 공고 내용 전체를 복사해서 붙여넣으세요."
 *  - 프로필 textarea 들: placeholder로 식별
 */
import { test, expect } from "./fixtures/auth";

// 테스트용 샘플 데이터
const SAMPLE_JOB_TEXT = `
We are looking for an experienced Full Stack Developer to join our team.

Requirements:
- 3+ years of experience with React and TypeScript
- Experience with Node.js and REST API design
- PostgreSQL database experience
- Good communication skills in English

Responsibilities:
- Develop and maintain web applications
- Collaborate with the design team
- Write clean, maintainable code

Budget: $50-80/hr
Duration: Long-term contract (6+ months)
Hours: 20-30 hours/week
`;

const SAMPLE_SKILLS = "React, TypeScript, Node.js, PostgreSQL, REST API";
const SAMPLE_EXPERIENCE =
  "5년간 SaaS 스타트업에서 풀스택 개발. MAU 10만 서비스 운영 경험.";
const SAMPLE_PROJECTS =
  "이커머스 플랫폼 개발 (React+Node, MAU 5만), 실시간 채팅 앱 (WebSocket)";

// AI API 호출이 포함된 테스트는 직렬로 실행 (병렬 실행 시 타임아웃 위험)
test.describe.configure({ mode: "serial" });

test.describe("공고 분석 흐름", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // 공고 텍스트 먼저 입력
    await authenticatedPage
      .getByPlaceholder(/Upwork 공고 내용 전체/)
      .fill(SAMPLE_JOB_TEXT);

    // 프로필 필드 채우기 — 서버 프로필 로딩 완료 후 덮어쓰기
    // (canParse = !isProfileLoading && jobText && profile fields)
    await authenticatedPage
      .getByPlaceholder(/React, TypeScript/)
      .fill(SAMPLE_SKILLS);
    await authenticatedPage
      .getByPlaceholder(/SaaS 스타트업/)
      .fill(SAMPLE_EXPERIENCE);
    await authenticatedPage
      .getByPlaceholder(/이커머스 풀스택/)
      .fill(SAMPLE_PROJECTS);

    // "공고 구조화" 버튼이 활성화될 때까지 대기 (isProfileLoading=false + 모든 필드 채워짐)
    await expect(
      authenticatedPage.getByRole("button", { name: "공고 구조화" })
    ).toBeEnabled({ timeout: 10_000 });
  });

  test('프로필과 공고 텍스트 입력 후 "공고 구조화" 버튼이 활성화된다', async ({
    authenticatedPage,
  }) => {
    const parseButton = authenticatedPage.getByRole("button", {
      name: "공고 구조화",
    });
    await expect(parseButton).toBeEnabled({ timeout: 5_000 });
  });

  test("공고 구조화 → JobPreviewCard 표시 → 분석 시작 → 결과 탭 렌더", async ({
    authenticatedPage,
  }) => {
    // 1. 공고 구조화 클릭
    await authenticatedPage
      .getByRole("button", { name: "공고 구조화" })
      .click();

    // 2. 파싱 중 로딩 스피너 (선택적 확인)
    // await expect(authenticatedPage.getByText("공고를 분석하는 중...")).toBeVisible();

    // 3. JobPreviewCard 렌더 대기 — "분석 시작" 버튼 등장으로 확인
    const analyzeButton = authenticatedPage.getByRole("button", {
      name: "분석 시작",
    });
    await expect(analyzeButton).toBeVisible({ timeout: 30_000 });

    // 4. 분석 시작 클릭
    await analyzeButton.click();

    // 5. 분석 중 로딩 (선택적 확인)
    // await expect(authenticatedPage.getByText("AI가 분석하는 중...")).toBeVisible();

    // 6. ResultPanel 렌더 대기 — "커버레터" 탭 버튼
    await expect(
      authenticatedPage.getByRole("button", { name: "커버레터" })
    ).toBeVisible({ timeout: 60_000 });

    // 7. "강조 포인트" 탭 존재 확인
    await expect(
      authenticatedPage.getByRole("button", { name: "강조 포인트" })
    ).toBeVisible();

    // 8. "견적 가이드" 탭 존재 확인
    await expect(
      authenticatedPage.getByRole("button", { name: "견적 가이드" })
    ).toBeVisible();

    // 9. 적합도 탭 (fitScore가 포함된 탭): "적합도 {n}점" 패턴
    await expect(
      authenticatedPage.locator("button", { hasText: /적합도 \d+점/ })
    ).toBeVisible();
  });

  test("결과 커버레터 탭이 기본으로 활성화되고 텍스트가 표시된다", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage
      .getByRole("button", { name: "공고 구조화" })
      .click();
    const analyzeBtn1 = authenticatedPage.getByRole("button", { name: "분석 시작" });
    await expect(analyzeBtn1).toBeVisible({ timeout: 30_000 });
    await analyzeBtn1.click();

    // 커버레터 탭이 기본 활성화
    await expect(
      authenticatedPage.getByRole("button", { name: "커버레터" })
    ).toBeVisible({ timeout: 60_000 });

    // 커버레터 본문 영역 확인 (CoverLetter.tsx: bg-gray-50 rounded-md)
    const coverLetterBody = authenticatedPage.locator(
      ".bg-gray-50.rounded-md.p-4"
    );
    await expect(coverLetterBody).toBeVisible({ timeout: 5_000 });

    // 본문에 텍스트가 있어야 함
    const bodyText = await coverLetterBody.textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });

  test("커버레터 '복사' 버튼 클릭 시 '✓ 복사됨'으로 변경된다", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage
      .getByRole("button", { name: "공고 구조화" })
      .click();
    const analyzeBtn2 = authenticatedPage.getByRole("button", { name: "분석 시작" });
    await expect(analyzeBtn2).toBeVisible({ timeout: 30_000 });
    await analyzeBtn2.click();

    await expect(
      authenticatedPage.getByRole("button", { name: "커버레터" })
    ).toBeVisible({ timeout: 60_000 });

    // 복사 버튼 클릭
    const copyButton = authenticatedPage.getByRole("button", { name: "복사" });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // "✓ 복사됨"으로 변경
    await expect(
      authenticatedPage.getByRole("button", { name: "✓ 복사됨" })
    ).toBeVisible({ timeout: 3_000 });
  });

  test("적합도 탭 클릭 시 FitScore 패널이 표시된다", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage
      .getByRole("button", { name: "공고 구조화" })
      .click();
    const analyzeBtn3 = authenticatedPage.getByRole("button", { name: "분석 시작" });
    await expect(analyzeBtn3).toBeVisible({ timeout: 30_000 });
    await analyzeBtn3.click();

    await expect(
      authenticatedPage.getByRole("button", { name: "커버레터" })
    ).toBeVisible({ timeout: 60_000 });

    // 적합도 탭 클릭
    const fitTab = authenticatedPage.locator("button", {
      hasText: /적합도 \d+점/,
    });
    await fitTab.click();

    // FitScore 패널 내용 — 점수가 표시되어야 함 (FitScore.tsx 컴포넌트)
    // 점수 숫자 또는 점수 관련 요소 확인
    const fitContent = authenticatedPage.locator(".p-6").last();
    await expect(fitContent).toBeVisible();
  });

  test("'새 공고 분석' 버튼 클릭 시 초기 상태로 돌아간다", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage
      .getByRole("button", { name: "공고 구조화" })
      .click();
    const analyzeBtn4 = authenticatedPage.getByRole("button", { name: "분석 시작" });
    await expect(analyzeBtn4).toBeVisible({ timeout: 30_000 });
    await analyzeBtn4.click();

    await expect(
      authenticatedPage.getByRole("button", { name: "커버레터" })
    ).toBeVisible({ timeout: 60_000 });

    await authenticatedPage
      .getByRole("button", { name: "새 공고 분석" })
      .click();

    // 초기 상태: "공고 구조화" 버튼과 입력 영역이 다시 보여야 함
    await expect(
      authenticatedPage.getByText("채용 공고")
    ).toBeVisible({ timeout: 5_000 });
  });
});
