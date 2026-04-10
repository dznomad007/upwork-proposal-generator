import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractJobTextFromHtml, isBlockedResponse } from "@/lib/scraping/upwork";

export const runtime = "nodejs";

const ScrapeRequestSchema = z.object({
  url: z
    .string()
    .url("올바른 URL을 입력해주세요")
    .refine(
      (u) => new URL(u).hostname.endsWith("upwork.com"),
      "Upwork 공고 URL만 지원합니다 (upwork.com)"
    ),
});

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "잘못된 요청입니다" }, { status: 400 });
  }

  const parsed = ScrapeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0]?.message },
      { status: 400 }
    );
  }

  const { url } = parsed.data;
  const timeoutMs = Number(process.env.SCRAPING_TIMEOUT_MS ?? 15000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });

    // HTTP 에러 (403, 429 등) → 즉시 폴백
    if (!res.ok) {
      console.warn(`[scrape] HTTP ${res.status} for ${url}`);
      return NextResponse.json({ success: false, fallback: "paste-text" });
    }

    const html = await res.text();

    // 차단/챌린지 페이지 감지 → 폴백
    if (isBlockedResponse(html)) {
      console.warn(`[scrape] Blocked response detected for ${url}`);
      return NextResponse.json({ success: false, fallback: "paste-text" });
    }

    // 폴백 체인으로 텍스트 추출
    const rawText = extractJobTextFromHtml(html);

    if (!rawText) {
      console.warn(`[scrape] No extractable text for ${url}`);
      return NextResponse.json({ success: false, fallback: "paste-text" });
    }

    return NextResponse.json({ success: true, data: { rawText } });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[scrape] Timeout (${timeoutMs}ms) for ${url}`);
    } else {
      console.error(`[scrape] Error for ${url}:`, err);
    }
    return NextResponse.json({ success: false, fallback: "paste-text" });
  } finally {
    clearTimeout(timer);
  }
}
