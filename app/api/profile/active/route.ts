import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "로그인이 필요합니다" }, { status: 401 });
  }

  const profile = await prisma.profile.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true, profileJson: true, source: true, resumeId: true, updatedAt: true },
  });

  return NextResponse.json({ success: true, data: profile ?? null });
}
