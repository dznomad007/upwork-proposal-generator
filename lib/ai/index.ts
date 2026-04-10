import type { AIProvider } from "./provider";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "anthropic";

  switch (provider) {
    case "openai": {
      const { OpenAIProvider } = require("./providers/openai");
      return new OpenAIProvider();
    }
    case "anthropic":
    default: {
      const { AnthropicProvider } = require("./providers/anthropic");
      return new AnthropicProvider();
    }
  }
}
