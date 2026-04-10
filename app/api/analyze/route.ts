import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { buildAnalyzeSystem, buildAnalyzePrompt } from "@/lib/ai/prompts";
import { AnalyzeRequestSchema, AnalysisResultSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "잘못된 요청입니다" }, { status: 400 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0]?.message ?? "입력값이 올바르지 않습니다" },
      { status: 400 }
    );
  }

  const { profile, job } = parsed.data;
  const provider = getAIProvider();
  const lang = profile.preferredLanguage === "ko" ? "Korean" : "English";
  const systemPrompt = buildAnalyzeSystem(lang);

  async function callAI(retry = false) {
    const prompt = retry
      ? buildAnalyzePrompt(profile, job) + "\n\nCRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanation."
      : buildAnalyzePrompt(profile, job);

    const text = await provider.complete(systemPrompt, prompt);
    const result = JSON.parse(text.trim());
    return AnalysisResultSchema.parse(result);
  }

  try {
    let result;
    try {
      result = await callAI(false);
    } catch {
      result = await callAI(true);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error(`[analyze][${provider.name}] 오류:`, err);
    return NextResponse.json(
      { success: false, message: "분석에 실패했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
