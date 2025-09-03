import { openai } from "@ai-sdk/openai";
import { wrapLanguageModel } from "ai";
import { createRagMiddleware } from "./rag";

export { openai };

export const DEFAULT_MODEL = "gpt-5-mini";

export function createRagEnabledModel(modelId: string = DEFAULT_MODEL) {
  const model = openai(modelId);

  return wrapLanguageModel({
    model,
    middleware: createRagMiddleware(),
  });
}
