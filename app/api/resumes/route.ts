import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "로그인이 필요합니다" }, { status: 401 });
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    select: { id: true, fileName: true, mimeType: true, parseStatus: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: resumes });
}
