import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const BodySchema = z.object({ resumeId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "로그인이 필요합니다" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "잘못된 요청입니다" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "resumeId가 필요합니다" }, { status: 400 });
  }

  const resume = await prisma.resume.findUnique({ where: { id: parsed.data.resumeId } });
  if (!resume) {
    return NextResponse.json({ success: false, message: "이력서를 찾을 수 없습니다" }, { status: 404 });
  }
  if (resume.userId !== user.id) {
    return NextResponse.json({ success: false, message: "권한이 없습니다" }, { status: 403 });
  }

  const txResult = await prisma.$transaction(async (tx) => {
    await tx.profile.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const profile = await tx.profile.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        profileJson: resume.parsedProfileJson as object,
        source: "resume_parsed",
        isActive: true,
      },
    });

    return { profile };
  });
  const { profile } = txResult;

  return NextResponse.json({
    success: true,
    data: { id: profile.id, profile: resume.parsedProfileJson },
  });
}
