export const MIME_PDF =
  "application/pdf";
export const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * PDF 또는 DOCX 버퍼에서 텍스트를 추출한다.
 *
 * - mimeType === MIME_PDF  → pdf-parse 사용
 * - mimeType === MIME_DOCX → mammoth 사용
 *
 * 지원하지 않는 MIME 타입이 들어오면 에러를 던진다.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === MIME_PDF) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (mimeType === MIME_DOCX) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`지원하지 않는 파일 형식입니다: ${mimeType}`);
}
