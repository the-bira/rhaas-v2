/**
 * Wrapper para pdf-parse com tipagem correta
 * pdf-parse é um módulo CommonJS, então usamos require
 */

interface PdfData {
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  text: string;
  version: string;
}

type PdfParseFunction = (dataBuffer: Buffer) => Promise<PdfData>;

// Importação dinâmica do pdf-parse
let pdfParseInstance: PdfParseFunction | null = null;

export async function parsePdf(buffer: Buffer): Promise<PdfData> {
  if (!pdfParseInstance) {
    // @ts-expect-error - pdf-parse é CommonJS
    pdfParseInstance = (await import("pdf-parse")).default;
  }
  
  if (!pdfParseInstance) {
    throw new Error("Failed to load pdf-parse library");
  }
  
  return pdfParseInstance(buffer);
}

