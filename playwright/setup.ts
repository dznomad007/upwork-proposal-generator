/**
 * 인증 세션을 저장하는 setup 스크립트.
 *
 * 실행:
 *   npm run test:e2e:setup
 *
 * 브라우저가 열리면 직접 로그인하세요.
 * 로그인 완료 후 자동으로 playwright/.auth/user.json에 세션이 저장됩니다.
 */
import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

async function setup() {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // 헤드 모드(화면 보이는 브라우저)로 실행 — Clerk 봇 감지 우회
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("\n🔐 브라우저가 열립니다. 로그인을 완료해주세요...");
  console.log("   로그인 후 http://localhost:3000/ 으로 이동하면 자동으로 세션이 저장됩니다.\n");

  await page.goto("http://localhost:3000/sign-in");

  // 홈(/)으로 이동할 때까지 대기 (최대 5분)
  await page.waitForURL("http://localhost:3000/", { timeout: 5 * 60 * 1000 });

  console.log("✅ 로그인 성공! 세션 저장 중...");
  await context.storageState({ path: AUTH_FILE });
  console.log(`✅ 세션 저장 완료: ${AUTH_FILE}`);

  await browser.close();
}

setup().catch((err) => {
  console.error("❌ setup 실패:", err);
  process.exit(1);
});
