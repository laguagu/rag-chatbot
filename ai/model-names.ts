// Define your models here.

export interface Model {
  id: string;
  label: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: "gpt-5-mini",
    label: "GPT 5 mini",
    description: "Small model for fast, lightweight tasks",
  },
  {
    id: "gpt-5",
    label: "GPT 5",
    description: "For complex, multi-step tasks",
  },
  {
    id: "rag",
    label: "RAG",
    description: "GPT-5 with custom retrieval",
  },
] as const;

export const DEFAULT_MODEL_NAME: string = "gpt-5-mini";
