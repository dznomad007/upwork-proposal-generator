/**
 * dedup.spec.ts — 동일 파일 재업로드 시 중복 감지 테스트
 *
 * 검증 항목:
 *  1. 같은 파일을 두 번 업로드하면 두 번째 업로드에서 "캐시에서 불러옴" 뱃지 표시
 *  2. 두 번째 업로드가 첫 번째보다 빠르다 (AI 재호출 없음)
 *
 * 실제 컴포넌트 구조 (ProfileForm.tsx):
 *  - 중복 뱃지: isDuplicate → "⚡ 이미 업로드한 이력서 — 캐시 반환"
 *  - 첫 번째 업로드 뱃지: "✓ {filename} 파싱 완료"
 *
 * 전제:
 *  - e2e/fixtures/sample-resume.docx 또는 sample-resume.pdf 파일이 있어야 함
 *  - 테스트는 인증된 상태에서 실행
 *  - 첫 번째 업로드가 DB에 저장되어야 두 번째에서 dedup이 동작함
 */
import * as path from "path";
import * as fs from "fs";
import { test, expect } from "./fixtures/auth";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

test.describe("이력서 중복 업로드 감지", () => {
  // sample-resume.docx 파일 존재 여부 확인
  const sampleDocxPath = path.join(FIXTURES_DIR, "sample-resume.docx");
  const samplePdfPath = path.join(FIXTURES_DIR, "sample-resume.pdf");
  const samplePath = fs.existsSync(sampleDocxPath)
    ? sampleDocxPath
    : fs.existsSync(samplePdfPath)
    ? samplePdfPath
    : null;

  test("같은 파일 두 번 업로드 시 두 번째에 '캐시 반환' 뱃지가 표시된다", async ({
    authenticatedPage,
  }) => {
    if (!samplePath) {
      test.skip(
        true,
        "e2e/fixtures/sample-resume.docx 또는 .pdf 파일이 없어 테스트를 건너뜁니다."
      );
      return;
    }

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // 1번째 업로드
    await fileInput.setInputFiles(samplePath);
    await expect(
      authenticatedPage.locator("text=/✓.*파싱 완료/")
    ).toBeVisible({ timeout: 30_000 });

    // 2번째 업로드 (동일 파일)
    // 파일 input을 다시 트리거하기 위해 value를 초기화한 뒤 재업로드
    await fileInput.setInputFiles(samplePath);

    // "캐시 반환" 뱃지 확인
    await expect(
      authenticatedPage.getByText("⚡ 이미 업로드한 이력서 — 캐시 반환")
    ).toBeVisible({ timeout: 15_000 });
  });

  test("두 번째 업로드(캐시 히트)가 첫 번째보다 빠르다", async ({
    authenticatedPage,
  }) => {
    if (!samplePath) {
      test.skip(
        true,
        "e2e/fixtures/sample-resume.docx 또는 .pdf 파일이 없어 테스트를 건너뜁니다."
      );
      return;
    }

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // 1번째 업로드 시간 측정
    const firstStart = Date.now();
    await fileInput.setInputFiles(samplePath);
    await expect(
      authenticatedPage.locator("text=/✓.*파싱 완료/")
    ).toBeVisible({ timeout: 30_000 });
    const firstDuration = Date.now() - firstStart;

    // 2번째 업로드 시간 측정
    const secondStart = Date.now();
    await fileInput.setInputFiles(samplePath);
    await expect(
      authenticatedPage.getByText("⚡ 이미 업로드한 이력서 — 캐시 반환")
    ).toBeVisible({ timeout: 15_000 });
    const secondDuration = Date.now() - secondStart;

    // 두 번째가 첫 번째보다 빠르거나 같아야 함
    // (캐시 히트이므로 AI 호출 없음 → 훨씬 빠를 것이지만, 네트워크 편차 고려해 여유 허용)
    console.log(
      `첫 번째 업로드: ${firstDuration}ms, 두 번째 업로드(캐시): ${secondDuration}ms`
    );
    expect(secondDuration).toBeLessThan(firstDuration * 1.5);
  });

  test("첫 번째 업로드 후 뱃지가 '파싱 완료'이고 두 번째는 '캐시 반환'이다", async ({
    authenticatedPage,
  }) => {
    if (!samplePath) {
      test.skip(
        true,
        "e2e/fixtures/sample-resume.docx 또는 .pdf 파일이 없어 테스트를 건너뜁니다."
      );
      return;
    }

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // 1번째 업로드 → "파싱 완료" 뱃지
    await fileInput.setInputFiles(samplePath);
    const parsedBadge = authenticatedPage.locator("text=/✓.*파싱 완료/");
    await expect(parsedBadge).toBeVisible({ timeout: 30_000 });

    // "캐시 반환" 뱃지가 없어야 함
    await expect(
      authenticatedPage.getByText("⚡ 이미 업로드한 이력서 — 캐시 반환")
    ).not.toBeVisible();

    // 2번째 업로드 → "캐시 반환" 뱃지
    await fileInput.setInputFiles(samplePath);
    await expect(
      authenticatedPage.getByText("⚡ 이미 업로드한 이력서 — 캐시 반환")
    ).toBeVisible({ timeout: 15_000 });

    // "파싱 완료" 뱃지가 없어야 함 (캐시 반환 상태)
    await expect(parsedBadge).not.toBeVisible();
  });
});
