import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { PARSE_JOB_SYSTEM, buildParseJobPrompt } from "@/lib/ai/prompts";
import { ParseJobRequestSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "잘못된 요청입니다" }, { status: 400 });
  }

  const parsed = ParseJobRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0]?.message ?? "입력값이 올바르지 않습니다" },
      { status: 400 }
    );
  }

  const { rawText } = parsed.data;
  const provider = getAIProvider();

  async function callAI(retry = false) {
    const prompt = retry
      ? buildParseJobPrompt(rawText) + "\n\nCRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanation."
      : buildParseJobPrompt(rawText);

    const text = await provider.complete(PARSE_JOB_SYSTEM, prompt);
    return JSON.parse(text.trim());
  }

  try {
    let result: { job: unknown; missingInfo: string[] };
    try {
      result = await callAI(false);
    } catch {
      result = await callAI(true);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error(`[parse-job][${provider.name}] 오류:`, err);
    return NextResponse.json(
      { success: false, message: "공고 파싱에 실패했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
