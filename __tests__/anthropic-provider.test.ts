import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";

// Anthropic SDK 전체를 mock 처리한다.
const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
  };
});

describe("AnthropicProvider", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // 환경 변수를 격리된 복사본으로 교체한다.
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("생성자", () => {
    it("ANTHROPIC_API_KEY가 설정되어 있으면 인스턴스를 생성해야 한다", () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      // Act & Assert
      expect(() => new AnthropicProvider()).not.toThrow();
    });

    it("ANTHROPIC_API_KEY가 없으면 에러를 던져야 한다", () => {
      // Arrange
      delete process.env.ANTHROPIC_API_KEY;

      // Act & Assert
      expect(() => new AnthropicProvider()).toThrow(
        "ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다"
      );
    });

    it("name 프로퍼티는 'anthropic' 이어야 한다", () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      // Act
      const provider = new AnthropicProvider();

      // Assert
      expect(provider.name).toBe("anthropic");
    });
  });

  describe("complete", () => {
    it("system과 userPrompt를 사용해 Anthropic API를 호출하고 텍스트를 반환해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      process.env.ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
      process.env.ANTHROPIC_MAX_TOKENS = "2000";

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "커버레터 내용입니다" }],
      });

      const provider = new AnthropicProvider();

      // Act
      const result = await provider.complete("시스템 프롬프트", "유저 프롬프트");

      // Assert
      expect(result).toBe("커버레터 내용입니다");
    });

    it("messages.create를 올바른 파라미터로 호출해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      process.env.ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
      process.env.ANTHROPIC_MAX_TOKENS = "1500";

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "응답" }],
      });

      const provider = new AnthropicProvider();
      const systemPrompt = "당신은 전문 작가입니다";
      const userPrompt = "커버레터를 작성해주세요";

      // Act
      await provider.complete(systemPrompt, userPrompt);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
    });

    it("ANTHROPIC_MODEL 환경 변수가 없으면 기본값 'claude-sonnet-4-20250514'를 사용해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      delete process.env.ANTHROPIC_MODEL;
      delete process.env.ANTHROPIC_MAX_TOKENS;

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "응답" }],
      });

      const provider = new AnthropicProvider();

      // Act
      await provider.complete("system", "user");

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: "claude-sonnet-4-20250514" })
      );
    });

    it("ANTHROPIC_MAX_TOKENS 환경 변수가 없으면 기본값 2000을 사용해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      delete process.env.ANTHROPIC_MAX_TOKENS;

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "응답" }],
      });

      const provider = new AnthropicProvider();

      // Act
      await provider.complete("system", "user");

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 2000 })
      );
    });

    it("응답 content가 비어 있으면 빈 문자열을 반환해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      mockCreate.mockResolvedValueOnce({ content: [] });

      const provider = new AnthropicProvider();

      // Act
      const result = await provider.complete("system", "user");

      // Assert
      expect(result).toBe("");
    });

    it("응답 content[0]의 type이 text가 아니면 빈 문자열을 반환해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "tool_1", name: "some_tool", input: {} }],
      });

      const provider = new AnthropicProvider();

      // Act
      const result = await provider.complete("system", "user");

      // Assert
      expect(result).toBe("");
    });

    it("API 호출이 실패하면 에러를 전파해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      mockCreate.mockRejectedValueOnce(new Error("API 호출 실패: 429 Too Many Requests"));

      const provider = new AnthropicProvider();

      // Act & Assert
      await expect(provider.complete("system", "user")).rejects.toThrow(
        "API 호출 실패: 429 Too Many Requests"
      );
    });

    it("ANTHROPIC_MAX_TOKENS가 문자열로 주어져도 숫자로 파싱해야 한다", async () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      process.env.ANTHROPIC_MAX_TOKENS = "3000";

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "응답" }],
      });

      const provider = new AnthropicProvider();

      // Act
      await provider.complete("system", "user");

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 3000 })
      );
    });
  });
});
