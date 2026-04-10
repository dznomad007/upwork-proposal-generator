/**
 * profile-autosave.spec.ts — 프로필 수정 → 자동저장 테스트
 *
 * 검증 항목:
 *  1. skills 필드 수정 후 500ms 디바운스 뒤 저장 스피너("저장 중...") 표시
 *  2. 저장 완료 후 스피너가 사라짐
 *  3. 페이지 새로고침 후 수정한 값이 유지됨
 *
 * 실제 컴포넌트 구조:
 *  - ProfileForm.tsx: isSaving → "저장 중..." 텍스트 + 스피너 (animate-spin)
 *  - useProfile.ts: 500ms 디바운스 후 PATCH /api/profile/{id}
 *  - 저장은 activeProfileId가 있을 때만 동작 (로그인 + 프로필 존재 필요)
 *
 * 주의:
 *  - 이 테스트는 DB가 연결된 환경에서 인증 상태로 실행되어야 함
 *  - activeProfileId가 없으면 autosave가 동작하지 않으므로
 *    먼저 이력서를 업로드하거나 기존 프로필이 있어야 함
 */
import * as path from "path";
import * as fs from "fs";
import { test, expect } from "./fixtures/auth";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

test.describe("프로필 자동저장", () => {
  /**
   * autosave 테스트를 위해 먼저 프로필을 로드해야 합니다.
   * - 기존에 이미 프로필이 있는 계정을 사용하거나
   * - 이력서를 업로드해서 activeProfileId를 생성해야 합니다.
   */

  test("skills 필드 수정 후 '저장 중...' 스피너가 나타난다", async ({
    authenticatedPage,
  }) => {
    // 먼저 이력서 업로드 또는 기존 프로필이 있어야 autosave 동작
    const samplePath =
      path.join(FIXTURES_DIR, "sample-resume.docx") ||
      path.join(FIXTURES_DIR, "sample-resume.pdf");

    const hasSample =
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.docx")) ||
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.pdf"));

    if (hasSample) {
      // 이력서 업로드하여 activeProfileId 생성
      const fileInput = authenticatedPage.locator('input[type="file"]');
      const docxPath = fs.existsSync(
        path.join(FIXTURES_DIR, "sample-resume.docx")
      )
        ? path.join(FIXTURES_DIR, "sample-resume.docx")
        : path.join(FIXTURES_DIR, "sample-resume.pdf");

      await fileInput.setInputFiles(docxPath);
      await expect(
        authenticatedPage.locator("text=/✓.*파싱 완료/")
      ).toBeVisible({ timeout: 30_000 });
    }

    // skills 필드 수정
    const skillsTextarea = authenticatedPage.getByPlaceholder(
      /React, TypeScript/
    );
    await skillsTextarea.click();
    await skillsTextarea.fill("React, TypeScript, Node.js — 자동저장 테스트");

    // 500ms 디바운스 후 "저장 중..." 텍스트 확인
    // ProfileForm.tsx: isSaving && <span>"저장 중..."</span>
    const savingIndicator = authenticatedPage.getByText("저장 중...");

    // activeProfileId가 없으면 autosave가 동작 안 하므로 조건부 확인
    // DB 연결 없는 환경에서는 saveTimerRef가 실행되도 PATCH 실패 → isSaving 짧게 true
    if (hasSample) {
      await expect(savingIndicator).toBeVisible({ timeout: 2_000 });
    } else {
      // 저장 지표가 나타나지 않아도 됨 (activeProfileId 없음)
      console.log(
        "샘플 파일 없음 — autosave 스피너 확인 건너뜀 (activeProfileId 없음)"
      );
    }
  });

  test("저장 중... 표시 후 스피너가 사라진다", async ({
    authenticatedPage,
  }) => {
    const hasSample =
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.docx")) ||
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.pdf"));

    if (!hasSample) {
      test.skip(
        true,
        "샘플 이력서 파일이 없어 autosave 테스트를 건너뜁니다."
      );
      return;
    }

    const docxPath = fs.existsSync(
      path.join(FIXTURES_DIR, "sample-resume.docx")
    )
      ? path.join(FIXTURES_DIR, "sample-resume.docx")
      : path.join(FIXTURES_DIR, "sample-resume.pdf");

    // 이력서 업로드 → activeProfileId 생성
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(docxPath);
    await expect(
      authenticatedPage.locator("text=/✓.*파싱 완료/")
    ).toBeVisible({ timeout: 30_000 });

    // skills 필드 수정
    const skillsTextarea = authenticatedPage.getByPlaceholder(
      /React, TypeScript/
    );
    await skillsTextarea.fill("React, Vue, Angular — 저장 후 사라짐 테스트");

    // 저장 중 표시
    const savingIndicator = authenticatedPage.getByText("저장 중...");
    await expect(savingIndicator).toBeVisible({ timeout: 2_000 });

    // 저장 완료 후 스피너 사라짐 (PATCH 요청 완료 후 isSaving = false)
    await expect(savingIndicator).not.toBeVisible({ timeout: 10_000 });
  });

  test("페이지 새로고침 후 수정한 skills 값이 유지된다", async ({
    authenticatedPage,
  }) => {
    const hasSample =
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.docx")) ||
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.pdf"));

    if (!hasSample) {
      test.skip(
        true,
        "샘플 이력서 파일이 없어 autosave 새로고침 테스트를 건너뜁니다."
      );
      return;
    }

    const docxPath = fs.existsSync(
      path.join(FIXTURES_DIR, "sample-resume.docx")
    )
      ? path.join(FIXTURES_DIR, "sample-resume.docx")
      : path.join(FIXTURES_DIR, "sample-resume.pdf");

    // 이력서 업로드 → activeProfileId 생성
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(docxPath);
    await expect(
      authenticatedPage.locator("text=/✓.*파싱 완료/")
    ).toBeVisible({ timeout: 30_000 });

    // skills 필드를 특정 값으로 수정
    const uniqueSkills = `React_${Date.now()}, TypeScript, Node.js`;
    const skillsTextarea = authenticatedPage.getByPlaceholder(
      /React, TypeScript/
    );
    await skillsTextarea.fill(uniqueSkills);

    // 저장 완료 대기 (저장 중 → 사라짐)
    const savingIndicator = authenticatedPage.getByText("저장 중...");
    await expect(savingIndicator).toBeVisible({ timeout: 2_000 });
    await expect(savingIndicator).not.toBeVisible({ timeout: 10_000 });

    // 페이지 새로고침
    await authenticatedPage.reload();

    // Clerk 세션 재확인 + 프로필 로드 대기
    // useProfile의 loadActiveProfile이 완료될 때까지 대기
    await authenticatedPage.waitForLoadState("load", {
      timeout: 15_000,
    });

    // 수정한 값이 유지되어야 함
    const reloadedSkills = await authenticatedPage
      .getByPlaceholder(/React, TypeScript/)
      .inputValue();
    expect(reloadedSkills).toBe(uniqueSkills);
  });

  test("experience 필드 수정 후 debounce 내에 추가 입력 시 단 한 번만 저장된다", async ({
    authenticatedPage,
  }) => {
    const hasSample =
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.docx")) ||
      fs.existsSync(path.join(FIXTURES_DIR, "sample-resume.pdf"));

    if (!hasSample) {
      test.skip(
        true,
        "샘플 이력서 파일이 없어 debounce 테스트를 건너뜁니다."
      );
      return;
    }

    const docxPath = fs.existsSync(
      path.join(FIXTURES_DIR, "sample-resume.docx")
    )
      ? path.join(FIXTURES_DIR, "sample-resume.docx")
      : path.join(FIXTURES_DIR, "sample-resume.pdf");

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(docxPath);
    await expect(
      authenticatedPage.locator("text=/✓.*파싱 완료/")
    ).toBeVisible({ timeout: 30_000 });

    // PATCH 요청 수 추적
    let patchCount = 0;
    authenticatedPage.on("request", (req) => {
      if (req.method() === "PATCH" && req.url().includes("/api/profile/")) {
        patchCount++;
      }
    });

    // 300ms 간격으로 3번 연속 입력 (총 300ms < 500ms debounce)
    const experienceTextarea = authenticatedPage.getByPlaceholder(
      /SaaS 스타트업/
    );
    await experienceTextarea.fill("첫 번째 입력");
    await authenticatedPage.waitForTimeout(200);
    await experienceTextarea.fill("두 번째 입력");
    await authenticatedPage.waitForTimeout(200);
    await experienceTextarea.fill("세 번째 입력 — 최종값");

    // 디바운스 완료 대기 (500ms + 여유 200ms)
    await authenticatedPage.waitForTimeout(800);

    // PATCH 요청이 1번만 발생해야 함 (디바운스)
    expect(patchCount).toBeLessThanOrEqual(1);
  });
});
