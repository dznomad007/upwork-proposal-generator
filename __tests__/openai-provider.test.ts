import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenAIProvider } from "@/lib/ai/providers/openai";

// OpenAI SDK 전체를 mock 처리한다.
const mockCreate = vi.fn();

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe("OpenAIProvider", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("생성자", () => {
    it("OPENAI_API_KEY가 설정되어 있으면 인스턴스를 생성해야 한다", () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";

      // Act & Assert
      expect(() => new OpenAIProvider()).not.toThrow();
    });

    it("OPENAI_API_KEY가 없으면 에러를 던져야 한다", () => {
      // Arrange
      delete process.env.OPENAI_API_KEY;

      // Act & Assert
      expect(() => new OpenAIProvider()).toThrow(
        "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다"
      );
    });

    it("name 프로퍼티는 'openai' 이어야 한다", () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";

      // Act
      const provider = new OpenAIProvider();

      // Assert
      expect(provider.name).toBe("openai");
    });
  });

  describe("complete", () => {
    it("system과 userPrompt를 사용해 OpenAI API를 호출하고 텍스트를 반환해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";
      process.env.OPENAI_MODEL = "gpt-4o";
      process.env.OPENAI_MAX_TOKENS = "2000";

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "GPT 응답 텍스트입니다" } }],
      });

      const provider = new OpenAIProvider();

      // Act
      const result = await provider.complete("시스템 프롬프트", "유저 프롬프트");

      // Assert
      expect(result).toBe("GPT 응답 텍스트입니다");
    });

    it("chat.completions.create를 올바른 파라미터로 호출해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";
      process.env.OPENAI_MODEL = "gpt-4o";
      process.env.OPENAI_MAX_TOKENS = "1500";

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "응답" } }],
      });

      const provider = new OpenAIProvider();
      const systemPrompt = "당신은 전문 작가입니다";
      const userPrompt = "커버레터를 작성해주세요";

      // Act
      await provider.complete(systemPrompt, userPrompt);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        model: "gpt-4o",
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    });

    it("response_format이 json_object로 설정되어야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "{}" } }],
      });

      const provider = new OpenAIProvider();

      // Act
      await provider.complete("system", "user");

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: "json_object" },
        })
      );
    });

    it("OPENAI_MODEL 환경 변수가 없으면 기본값 'gpt-4o'를 사용해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";
      delete process.env.OPENAI_MODEL;
      delete process.env.OPENAI_MAX_TOKENS;

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "응답" } }],
      });

      const provider = new OpenAIProvider();

      // Act
      await provider.complete("system", "user");

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: "gpt-4o" })
      );
    });

    it("OPENAI_MAX_TOKENS 환경 변수가 없으면 기본값 2000을 사용해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";
      delete process.env.OPENAI_MAX_TOKENS;

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "응답" } }],
      });

      const provider = new OpenAIProvider();

      // Act
      await provider.complete("system", "user");

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 2000 })
      );
    });

    it("choices 배열이 비어 있으면 빈 문자열을 반환해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";

      mockCreate.mockResolvedValueOnce({ choices: [] });

      const provider = new OpenAIProvider();

      // Act
      const result = await provider.complete("system", "user");

      // Assert
      expect(result).toBe("");
    });

    it("message.content가 null이면 빈 문자열을 반환해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const provider = new OpenAIProvider();

      // Act
      const result = await provider.complete("system", "user");

      // Assert
      expect(result).toBe("");
    });

    it("API 호출이 실패하면 에러를 전파해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";

      mockCreate.mockRejectedValueOnce(new Error("API 호출 실패: 503 Service Unavailable"));

      const provider = new OpenAIProvider();

      // Act & Assert
      await expect(provider.complete("system", "user")).rejects.toThrow(
        "API 호출 실패: 503 Service Unavailable"
      );
    });

    it("OPENAI_MAX_TOKENS가 문자열로 주어져도 숫자로 파싱해야 한다", async () => {
      // Arrange
      process.env.OPENAI_API_KEY = "sk-test-key";
      process.env.OPENAI_MAX_TOKENS = "4096";

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "응답" } }],
      });

      const provider = new OpenAIProvider();

      // Act
      await provider.complete("system", "user");

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 4096 })
      );
    });
  });
});
