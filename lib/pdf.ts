import { readFileSync } from "fs";
import { join } from "path";
import pdf from "pdf-parse";

// Function to get PDF content from local file in project root
export async function getPdfContentFromFile(filename: string): Promise<string> {
  console.log("Reading PDF from file:", filename);

  try {
    const filePath = join(process.cwd(), filename);
    console.log("Reading from path:", filePath);

    const buffer = readFileSync(filePath);
    const pdfData = await pdf(buffer);

    console.log(
      "PDF parsed successfully, content length:",
      pdfData.text.length,
    );
    return pdfData.text;
  } catch (error) {
    console.error("Error reading or parsing PDF:", error);
    throw new Error(
      `Failed to process PDF file ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Function to get PDF content from URL (for network files)
export async function getPdfContentFromUrl(url: string): Promise<string> {
  console.log("Fetching PDF from URL:", url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdf(buffer);

    console.log(
      "PDF parsed successfully, content length:",
      pdfData.text.length,
    );
    return pdfData.text;
  } catch (error) {
    console.error("Error fetching or parsing PDF:", error);
    throw new Error(
      `Failed to process PDF from ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Parse PDF text from a Buffer
export async function getPdfContentFromBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfData = await pdf(buffer);
    return pdfData.text;
  } catch (error) {
    console.error("Error parsing PDF buffer:", error);
    throw new Error(
      `Failed to process PDF buffer: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
