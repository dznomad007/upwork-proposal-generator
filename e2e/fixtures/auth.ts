/**
 * 인증 Fixture
 *
 * storageState 방식: 미리 저장된 세션을 재사용합니다.
 * 세션 파일이 없으면 `npm run test:e2e:setup`을 먼저 실행하세요.
 *
 * 세션 저장 위치: playwright/.auth/user.json (gitignore에 추가됨)
 */
import { test as base, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const AUTH_FILE = path.join(__dirname, "../../playwright/.auth/user.json");

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ browser }, use) => {
    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error(
        "인증 세션 파일이 없습니다.\n" +
        "먼저 아래 명령어로 로그인 세션을 저장해주세요:\n\n" +
        "  npm run test:e2e:setup\n"
      );
    }

    // 저장된 세션으로 새 컨텍스트 생성
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForLoadState("load");

    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
