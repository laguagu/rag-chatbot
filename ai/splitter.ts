import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkText(
  text: string,
  chunkSize = 1200,
  overlap = 200,
): Promise<string[]> {
  const clean = text.replace(/\s+/g, " ").trim();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
    separators: [
      "\n\n",
      "\n",
      "。",
      "！",
      "？",
      ". ",
      "? ",
      "! ",
      "; ",
      ": ",
      " ",
      "",
    ],
  });

  return splitter.splitText(clean);
}
