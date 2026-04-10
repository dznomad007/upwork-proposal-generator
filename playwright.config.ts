import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// .env.local에서 환경변수 로드
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * Clerk 테스트 토큰 방식(옵션B)을 사용하기 위해
 * .env.local에 아래 변수가 필요합니다:
 *
 *   CLERK_SECRET_KEY=sk_test_...
 *
 * Clerk 대시보드 → Testing tokens → "Enable testing tokens" ON 후
 * 발급된 Publishable Key를 사용하면 setupClerkTestingToken()이
 * 실제 로그인 UI 없이 세션을 바로 만들어 줍니다.
 *
 * 참고: https://clerk.com/docs/testing/playwright/overview
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    permissions: ["clipboard-read", "clipboard-write"],
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
