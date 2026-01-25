// Pricing per 1M tokens
// Prices in USD - Vercel AI Gateway passes through provider pricing
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI GPT-4o
  "gpt-4o": {
    input: 2.5, // $2.50 per 1M input tokens
    output: 10.0, // $10.00 per 1M output tokens
  },
  // Anthropic Claude 3.5 Sonnet
  "claude-3-sonnet-20240229": {
    input: 3.0, // $3.00 per 1M input tokens
    output: 15.0, // $15.00 per 1M output tokens
  },
  // xAI Grok
  "grok-3": {
    input: 3.0, // $3.00 per 1M input tokens
    output: 15.0, // $15.00 per 1M output tokens
  },
};

/**
 * Calculate the cost of a model response based on token usage
 * @param model - The model identifier
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @returns Cost in USD
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = PRICING[model];

  if (!pricing) {
    console.warn(`No pricing found for model: ${model}, using default pricing`);
    return 0;
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Format cost for display
 * @param cost - Cost in USD
 * @returns Formatted string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Format latency for display
 * @param latency - Latency in milliseconds
 * @returns Formatted string
 */
export function formatLatency(latency: number): string {
  if (latency < 1000) {
    return `${latency}ms`;
  }
  return `${(latency / 1000).toFixed(2)}s`;
}
