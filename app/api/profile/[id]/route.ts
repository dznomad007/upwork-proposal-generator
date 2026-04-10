import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { UserProfileSchema } from "@/lib/validation/schemas";

const PatchBodySchema = z.object({
  profileJson: UserProfileSchema,
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "로그인이 필요합니다" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) {
    return NextResponse.json({ success: false, message: "프로필을 찾을 수 없습니다" }, { status: 404 });
  }
  if (profile.userId !== user.id) {
    return NextResponse.json({ success: false, message: "권한이 없습니다" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "잘못된 요청입니다" }, { status: 400 });
  }

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0]?.message ?? "입력값이 올바르지 않습니다" },
      { status: 400 }
    );
  }

  const updated = await prisma.profile.update({
    where: { id },
    data: {
      profileJson: parsed.data.profileJson as object,
      source: profile.source === "resume_parsed" ? "hybrid" : profile.source,
    },
    select: { id: true, updatedAt: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
