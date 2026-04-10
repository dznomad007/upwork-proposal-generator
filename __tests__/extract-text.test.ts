import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractText, MIME_PDF, MIME_DOCX } from "@/lib/resume/extract-text";

// --- 모듈 수준 mock (hoisted) ---

const mockPdfParse = vi.fn();

vi.mock("pdf-parse", () => ({
  default: mockPdfParse,
}));

const mockExtractRawText = vi.fn();

vi.mock("mammoth", () => ({
  extractRawText: mockExtractRawText,
}));

// --------------------------------

describe("extractText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PDF 파일 처리", () => {
    it("MIME 타입이 application/pdf 일 때 pdf-parse를 호출해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("fake pdf content");
      mockPdfParse.mockResolvedValueOnce({ text: "PDF 텍스트 내용입니다" });

      // Act
      const result = await extractText(buffer, MIME_PDF);

      // Assert
      expect(mockPdfParse).toHaveBeenCalledOnce();
      expect(mockPdfParse).toHaveBeenCalledWith(buffer);
      expect(result).toBe("PDF 텍스트 내용입니다");
    });

    it("pdf-parse가 반환한 text 값을 그대로 반환해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("pdf bytes");
      const expectedText = "React, TypeScript, Node.js 경력 5년";
      mockPdfParse.mockResolvedValueOnce({ text: expectedText });

      // Act
      const result = await extractText(buffer, MIME_PDF);

      // Assert
      expect(result).toBe(expectedText);
    });

    it("pdf-parse가 에러를 던지면 extractText도 에러를 전파해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("corrupted pdf");
      mockPdfParse.mockRejectedValueOnce(new Error("PDF 파싱 실패"));

      // Act & Assert
      await expect(extractText(buffer, MIME_PDF)).rejects.toThrow("PDF 파싱 실패");
    });

    it("pdf-parse가 빈 텍스트를 반환하면 빈 문자열을 반환해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("image-only pdf");
      mockPdfParse.mockResolvedValueOnce({ text: "" });

      // Act
      const result = await extractText(buffer, MIME_PDF);

      // Assert
      expect(result).toBe("");
    });

    it("mammoth를 호출하지 않아야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("pdf bytes");
      mockPdfParse.mockResolvedValueOnce({ text: "텍스트" });

      // Act
      await extractText(buffer, MIME_PDF);

      // Assert
      expect(mockExtractRawText).not.toHaveBeenCalled();
    });
  });

  describe("DOCX 파일 처리", () => {
    it("MIME 타입이 DOCX 일 때 mammoth.extractRawText를 호출해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("fake docx content");
      mockExtractRawText.mockResolvedValueOnce({
        value: "DOCX 텍스트 내용입니다",
        messages: [],
      });

      // Act
      const result = await extractText(buffer, MIME_DOCX);

      // Assert
      expect(mockExtractRawText).toHaveBeenCalledOnce();
      expect(mockExtractRawText).toHaveBeenCalledWith({ buffer });
      expect(result).toBe("DOCX 텍스트 내용입니다");
    });

    it("mammoth result의 value만 반환하고 messages(warning)는 무시해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("docx bytes");
      const expectedValue = "백엔드 개발자 이력서";
      mockExtractRawText.mockResolvedValueOnce({
        value: expectedValue,
        messages: [
          { type: "warning", message: "Unrecognised element" },
          { type: "warning", message: "Unknown style" },
        ],
      });

      // Act
      const result = await extractText(buffer, MIME_DOCX);

      // Assert
      expect(result).toBe(expectedValue);
    });

    it("mammoth가 에러를 던지면 extractText도 에러를 전파해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("corrupted docx");
      mockExtractRawText.mockRejectedValueOnce(new Error("DOCX 파싱 실패"));

      // Act & Assert
      await expect(extractText(buffer, MIME_DOCX)).rejects.toThrow("DOCX 파싱 실패");
    });

    it("mammoth가 빈 value를 반환하면 빈 문자열을 반환해야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("empty docx");
      mockExtractRawText.mockResolvedValueOnce({ value: "", messages: [] });

      // Act
      const result = await extractText(buffer, MIME_DOCX);

      // Assert
      expect(result).toBe("");
    });

    it("pdf-parse를 호출하지 않아야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("docx bytes");
      mockExtractRawText.mockResolvedValueOnce({ value: "텍스트", messages: [] });

      // Act
      await extractText(buffer, MIME_DOCX);

      // Assert
      expect(mockPdfParse).not.toHaveBeenCalled();
    });
  });

  describe("지원하지 않는 MIME 타입", () => {
    it("image/png MIME 타입이면 에러를 던져야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("png bytes");

      // Act & Assert
      await expect(extractText(buffer, "image/png")).rejects.toThrow(
        "지원하지 않는 파일 형식입니다: image/png"
      );
    });

    it("text/plain MIME 타입이면 에러를 던져야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("plain text");

      // Act & Assert
      await expect(extractText(buffer, "text/plain")).rejects.toThrow(
        "지원하지 않는 파일 형식입니다: text/plain"
      );
    });

    it("빈 문자열 MIME 타입이면 에러를 던져야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("data");

      // Act & Assert
      await expect(extractText(buffer, "")).rejects.toThrow(
        "지원하지 않는 파일 형식입니다: "
      );
    });

    it("지원하지 않는 타입일 때 pdf-parse와 mammoth를 모두 호출하지 않아야 한다", async () => {
      // Arrange
      const buffer = Buffer.from("data");

      // Act
      await extractText(buffer, "application/zip").catch(() => {});

      // Assert
      expect(mockPdfParse).not.toHaveBeenCalled();
      expect(mockExtractRawText).not.toHaveBeenCalled();
    });
  });

  describe("MIME 타입 상수", () => {
    it("MIME_PDF 상수는 'application/pdf' 여야 한다", () => {
      expect(MIME_PDF).toBe("application/pdf");
    });

    it("MIME_DOCX 상수는 올바른 OOXML MIME 타입이어야 한다", () => {
      expect(MIME_DOCX).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    });
  });
});
