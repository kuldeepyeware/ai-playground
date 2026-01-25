import { gateway } from "@ai-sdk/gateway";

// The gateway() function returns a model that uses AI_GATEWAY_API_KEY
export const GATEWAY_MODELS = {
  openai: {
    modelId: "openai/gpt-4o" as const,
    displayName: "GPT-4o",
    pricingKey: "gpt-4o",
  },
  anthropic: {
    modelId: "anthropic/claude-3-5-sonnet-20241022" as const,
    displayName: "Claude 3.5 Sonnet",
    pricingKey: "claude-3-sonnet-20240229",
  },
  xai: {
    modelId: "xai/grok-3" as const,
    displayName: "Grok 3",
    pricingKey: "grok-3",
  },
} as const;

export type Provider = keyof typeof GATEWAY_MODELS;

// Export helper to get model config with actual model instance
export function getModelConfig(provider: Provider) {
  const config = GATEWAY_MODELS[provider];
  return {
    ...config,
    model: gateway(config.modelId),
  };
}
