import { prisma } from "@/lib/db";
import { Provider } from "@/lib/adapters/gateway";

const MODEL_NAMES: Record<Provider, string> = {
  openai: "GPT-4o",
  anthropic: "Claude 3.5 Sonnet",
  xai: "Grok 3",
};

// Check if error is an abort/connection reset error (client disconnected)
function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorCode = (error as NodeJS.ErrnoException).code;
    return (
      error.name === "AbortError" ||
      errorCode === "ECONNRESET" ||
      errorCode === "ERR_STREAM_PREMATURE_CLOSE" ||
      error.message.includes("aborted") ||
      error.message.includes("ECONNRESET")
    );
  }
  return false;
}

// Check if response already exists for this prompt and provider
async function responseExists(
  promptId: string,
  provider: string,
): Promise<boolean> {
  const existing = await prisma.response.findFirst({
    where: {
      promptId,
      provider,
    },
  });
  return !!existing;
}

export { responseExists, isAbortError, MODEL_NAMES };
