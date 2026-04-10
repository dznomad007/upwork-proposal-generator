import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { PARSE_RESUME_SYSTEM, buildParseResumePrompt } from "@/lib/ai/prompts";
import { ParseResumeResponseSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { extractText } from "@/lib/resume/extract-text";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

async function computeHash(buffer: Buffer): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(buffer).digest("hex");
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "로그인이 필요합니다" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: "잘못된 요청입니다" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, message: "파일이 없습니다" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ success: false, message: "PDF 또는 DOCX 파일만 업로드할 수 있습니다" }, { status: 422 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, message: "파일 크기는 10MB 이하여야 합니다" }, { status: 422 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileHash = await computeHash(buffer);

  // 중복 검사
  const existingResume = await prisma.resume.findUnique({
    where: { userId_fileHash: { userId: user.id, fileHash } },
    include: { profiles: { where: { isActive: true }, take: 1 } },
  });

  if (existingResume) {
    const activeProfile = existingResume.profiles[0] ?? await prisma.profile.findFirst({
      where: { userId: user.id, isActive: true },
    });
    return NextResponse.json({
      success: true,
      deduped: true,
      resumeId: existingResume.id,
      profileId: activeProfile?.id ?? null,
      profile: activeProfile?.profileJson ?? existingResume.parsedProfileJson,
    });
  }

  // 텍스트 추출
  let rawText: string;
  try {
    rawText = await extractText(buffer, file.type);
  } catch {
    return NextResponse.json({ success: false, message: "파일에서 텍스트를 추출할 수 없습니다" }, { status: 422 });
  }

  if (rawText.trim().length < 50) {
    return NextResponse.json({ success: false, message: "이력서에서 충분한 텍스트를 찾을 수 없습니다" }, { status: 422 });
  }

  // AI 파싱
  const provider = getAIProvider();

  async function callAI(retry = false): Promise<UserProfile> {
    const prompt = retry
      ? buildParseResumePrompt(rawText) + "\n\nCRITICAL: Return ONLY valid JSON. No markdown."
      : buildParseResumePrompt(rawText);
    const text = await provider.complete(PARSE_RESUME_SYSTEM, prompt);
    const parsed = ParseResumeResponseSchema.parse(JSON.parse(text.trim()));

    return {
      skills: parsed.skills,
      experience: parsed.experience,
      projects: parsed.projects,
      availability: parsed.availability,
      hourlyRate: {
        min: parsed.hourlyRate?.min ?? undefined,
        max: parsed.hourlyRate?.max ?? undefined,
      },
      preferredLanguage: "ko",
    };
  }

  let parsedProfile: UserProfile;
  try {
    try {
      parsedProfile = await callAI(false);
    } catch {
      parsedProfile = await callAI(true);
    }
  } catch (err) {
    console.error("[resumes/upload] AI 파싱 오류:", err);
    return NextResponse.json({ success: false, message: "이력서 파싱에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
  }

  // DB 저장 (트랜잭션)
  const txResult = await prisma.$transaction(async (tx) => {
    const resume = await tx.resume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileHash,
        mimeType: file.type,
        rawText,
        parsedProfileJson: parsedProfile as object,
        parseStatus: "done",
      },
    });

    // 기존 active profile 비활성화
    await tx.profile.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const profile = await tx.profile.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        profileJson: parsedProfile as object,
        source: "resume_parsed",
        isActive: true,
      },
    });

    return { resume, profile };
  });
  const { resume, profile } = txResult;

  return NextResponse.json({
    success: true,
    deduped: false,
    resumeId: resume.id,
    profileId: profile.id,
    profile: parsedProfile,
  });
}
