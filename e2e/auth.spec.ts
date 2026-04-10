/**
 * auth.spec.ts — 로그인/로그아웃 흐름 테스트
 *
 * 검증 항목:
 *  1. 비인증 상태에서 "/" 접근 시 "로그인" 버튼이 노출된다.
 *  2. 인증 상태에서 "/" 접근 시 UserButton(아바타)이 노출된다.
 */
import { test, expect } from "@playwright/test";
import { test as authTest } from "./fixtures/auth";

test.describe("비인증 상태", () => {
  test('홈("/")에서 로그인 버튼이 보여야 한다', async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");

    // page.tsx: !isSignedIn → <SignInButton> → <button>로그인</button>
    // isLoaded 조건 없이 렌더되므로 바로 찾을 수 있음
    const signInButton = page.getByRole("button", { name: "로그인" });
    await expect(signInButton).toBeVisible({ timeout: 10_000 });
  });

  test("헤더에 앱 제목이 보여야 한다", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Upwork Proposal Generator" })
    ).toBeVisible();
  });
});

authTest.describe("인증 상태", () => {
  authTest(
    '홈("/")에서 UserButton(아바타)이 보여야 한다',
    async ({ authenticatedPage }) => {
      // Clerk UserButton은 cl-userButtonAvatarBox 클래스를 가진 버튼 또는 이미지를 렌더링
      // 인증 상태에서는 "로그인" 버튼이 없어야 함
      const signInButton = authenticatedPage.getByRole("button", {
        name: "로그인",
      });
      await expect(signInButton).not.toBeVisible({ timeout: 10_000 });

      // UserButton 컨테이너 확인 (Clerk이 렌더하는 버튼/아바타)
      // Clerk UserButton은 aria-label이 "Open user button"인 버튼을 렌더링
      const userButton = authenticatedPage.locator(
        '[data-localization-key="userButton.action__manageAccount"],' +
          " .cl-userButtonAvatarBox," +
          " button[aria-label*='user']," +
          " .cl-userButtonBox"
      );

      // UserButton이 마운트되었는지 확인 (Clerk 컴포넌트가 DOM에 있어야 함)
      // 인증되면 헤더의 UserButton wrapper가 보임
      await expect(authenticatedPage.locator(".cl-userButtonTrigger, [data-clerk-component='UserButton'] button")).toBeVisible({
        timeout: 10_000,
      });
    }
  );

  authTest(
    '인증된 상태에서 프로필 섹션("내 프로필")이 렌더된다',
    async ({ authenticatedPage }) => {
      await expect(
        authenticatedPage.getByRole("heading", { name: "내 프로필" })
      ).toBeVisible({ timeout: 10_000 });
    }
  );
});
