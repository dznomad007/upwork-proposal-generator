import OpenAI from "openai";
import type { AIProvider } from "../provider";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다");
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async complete(system: string, userPrompt: string): Promise<string> {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o";
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "2000");

    const response = await this.client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
