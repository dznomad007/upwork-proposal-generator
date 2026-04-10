import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "../provider";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다");
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async complete(system: string, userPrompt: string): Promise<string> {
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    const maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? "2000");

    const message = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    return message.content[0]?.type === "text" ? message.content[0].text : "";
  }
}
