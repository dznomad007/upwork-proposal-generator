import mammoth from "mammoth";
import fs from "fs";
import path from "path";

const filePath = "/Users/intaekim/Documents/개인/이력서/경력서_김인태_2026.docx";

console.log("📄 파일 읽는 중:", filePath);

const buffer = fs.readFileSync(filePath);
console.log(`📦 파일 크기: ${(buffer.length / 1024).toFixed(1)} KB\n`);

try {
  const result = await mammoth.extractRawText({ buffer });

  if (result.messages.length > 0) {
    console.log("⚠️  mammoth 경고:");
    result.messages.forEach((m) => console.log("  -", m.message));
    console.log();
  }

  const text = result.value;
  console.log(`✅ 추출된 텍스트 (${text.length}자):\n`);
  console.log("─".repeat(60));
  console.log(text);
  console.log("─".repeat(60));

  // 최소 길이 체크 (route.ts 기준: 50자)
  if (text.trim().length < 50) {
    console.log("\n❌ 텍스트가 너무 짧습니다 (50자 미만) → AI 파싱 불가");
  } else {
    console.log(`\n✅ 텍스트 길이 충분 (${text.trim().length}자) → AI 파싱 가능`);
  }
} catch (err) {
  console.error("❌ 파싱 실패:", err);
}
