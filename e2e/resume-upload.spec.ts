/**
 * resume-upload.spec.ts — 이력서 업로드 → AI 파싱 → 프로필 반영 테스트
 *
 * 검증 항목:
 *  1. 인증된 상태에서 DOCX 파일 업로드 후 "파싱 완료" 뱃지 표시
 *  2. 업로드 후 프로필 폼(skills/experience/projects) 필드가 채워짐
 *  3. 10MB 초과 파일 업로드 시 에러 메시지 표시
 *  4. 지원하지 않는 형식(txt) 업로드 시 에러 메시지 표시
 *
 * 실제 컴포넌트 구조 (ProfileForm.tsx):
 *  - 파일 input: type="file", accept=".pdf,.docx,..."  (hidden)
 *  - 업로드 영역: "드래그하거나 클릭하여 업로드"
 *  - 파싱 완료 뱃지: "✓ {filename} 파싱 완료"
 *  - 캐시 뱃지: "⚡ 이미 업로드한 이력서 — 캐시 반환"
 *  - 에러: uploadError → <p className="...text-red-600">{uploadError}</p>
 */
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { test, expect } from "./fixtures/auth";

// 임시 테스트용 DOCX/PDF 파일 생성 헬퍼
// 실제 DOCX 구조의 최소 바이너리 대신, API가 내용을 검증하므로
// mammoth가 파싱 가능한 최소 DOCX zip 구조를 만들어야 한다.
// 여기서는 테스트용 샘플 파일을 fixtures 폴더에 두거나 임시 생성한다.

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

/**
 * 최소한의 유효한 DOCX 파일을 생성한다.
 * (실제 API 테스트에는 실제 파일이 필요하므로 fixtures에 샘플을 두는 것을 권장)
 * 여기서는 Buffer를 이용해 PK 시그니처를 가진 임시 파일을 생성한다.
 */
function createTempFile(name: string, content: Buffer): string {
  const tmpPath = path.join(os.tmpdir(), name);
  fs.writeFileSync(tmpPath, content);
  return tmpPath;
}

// 10MB + 1 byte 크기의 더미 파일 (용량 초과 테스트용)
function createOversizedFile(): string {
  const size = 10 * 1024 * 1024 + 1; // 10MB + 1 byte
  const buf = Buffer.alloc(size, 0);
  // PDF 헤더를 붙여 형식은 맞추되 용량 초과
  buf.write("%PDF-1.4", 0, "ascii");
  return createTempFile("oversized.pdf", buf);
}

// 일반 텍스트 파일 (지원하지 않는 형식 테스트용)
function createTextFile(): string {
  return createTempFile(
    "resume.txt",
    Buffer.from("This is a plain text resume.")
  );
}

test.describe("이력서 업로드", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // fixtures 디렉토리에 테스트용 샘플 DOCX가 있으면 사용
    // 없으면 해당 테스트를 skip
  });

  test('업로드 영역("드래그하거나 클릭하여 업로드")이 렌더된다', async ({
    authenticatedPage,
  }) => {
    await expect(
      authenticatedPage.getByText("드래그하거나 클릭하여 업로드")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("10MB 초과 파일 업로드 시 에러 메시지가 표시된다", async ({
    authenticatedPage,
  }) => {
    const oversizedPath = createOversizedFile();

    try {
      // 숨겨진 file input을 직접 조작
      const fileInput = authenticatedPage.locator('input[type="file"]');
      await fileInput.setInputFiles(oversizedPath);

      // 에러 메시지 확인 (ProfileForm의 uploadError → red-600 텍스트)
      const errorMsg = authenticatedPage.locator(".text-red-600");
      await expect(errorMsg).toBeVisible({ timeout: 15_000 });
    } finally {
      fs.unlinkSync(oversizedPath);
    }
  });

  test("지원하지 않는 형식(txt) 업로드 시 에러 메시지가 표시된다", async ({
    authenticatedPage,
  }) => {
    const txtPath = createTextFile();

    try {
      const fileInput = authenticatedPage.locator('input[type="file"]');
      await fileInput.setInputFiles(txtPath);

      // 에러 메시지 확인
      const errorMsg = authenticatedPage.locator(".text-red-600");
      await expect(errorMsg).toBeVisible({ timeout: 15_000 });
    } finally {
      fs.unlinkSync(txtPath);
    }
  });

  // DOCX 업로드 후 파싱 완료 확인 — 실제 파일이 있을 때만 실행
  test("DOCX 파일 업로드 후 '파싱 완료' 뱃지가 표시된다", async ({
    authenticatedPage,
  }) => {
    const sampleDocxPath = path.join(FIXTURES_DIR, "sample-resume.docx");

    if (!fs.existsSync(sampleDocxPath)) {
      test.skip(
        true,
        "e2e/fixtures/sample-resume.docx 파일이 없어 테스트를 건너뜁니다."
      );
      return;
    }

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleDocxPath);

    // 업로드 중 스피너 확인 (선택적)
    // await expect(authenticatedPage.getByText("이력서 파싱 중...")).toBeVisible();

    // 파싱 완료 뱃지: "✓ sample-resume.docx 파싱 완료"
    await expect(
      authenticatedPage.locator(
        "text=/✓.*파싱 완료/"
      )
    ).toBeVisible({ timeout: 30_000 });
  });

  test("DOCX 업로드 후 skills/experience/projects 필드가 채워진다", async ({
    authenticatedPage,
  }) => {
    const sampleDocxPath = path.join(FIXTURES_DIR, "sample-resume.docx");

    if (!fs.existsSync(sampleDocxPath)) {
      test.skip(
        true,
        "e2e/fixtures/sample-resume.docx 파일이 없어 테스트를 건너뜁니다."
      );
      return;
    }

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleDocxPath);

    // 파싱 완료 대기
    await expect(
      authenticatedPage.locator("text=/✓.*파싱 완료/")
    ).toBeVisible({ timeout: 30_000 });

    // 프로필 폼 필드가 비어있지 않음을 확인
    // ProfileForm.tsx: <textarea placeholder="예: React, TypeScript..."> — value는 profile.skills
    const skillsTextarea = authenticatedPage.getByPlaceholder(
      /React, TypeScript/
    );
    const skillsValue = await skillsTextarea.inputValue();
    expect(skillsValue.trim().length).toBeGreaterThan(0);

    const experienceTextarea = authenticatedPage.getByPlaceholder(
      /SaaS 스타트업/
    );
    const experienceValue = await experienceTextarea.inputValue();
    expect(experienceValue.trim().length).toBeGreaterThan(0);

    const projectsTextarea = authenticatedPage.getByPlaceholder(
      /이커머스 풀스택/
    );
    const projectsValue = await projectsTextarea.inputValue();
    expect(projectsValue.trim().length).toBeGreaterThan(0);
  });

  test("PDF 파일 업로드 후 파싱 완료 뱃지가 표시된다", async ({
    authenticatedPage,
  }) => {
    const samplePdfPath = path.join(FIXTURES_DIR, "sample-resume.pdf");

    if (!fs.existsSync(samplePdfPath)) {
      test.skip(
        true,
        "e2e/fixtures/sample-resume.pdf 파일이 없어 테스트를 건너뜁니다."
      );
      return;
    }

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(samplePdfPath);

    await expect(
      authenticatedPage.locator("text=/✓.*파싱 완료/")
    ).toBeVisible({ timeout: 30_000 });
  });
});
