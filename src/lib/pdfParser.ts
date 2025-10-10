/**
 * Parser de PDF usando pdf-parse v1.x
 * Versão estável e server-safe, sem dependência de workers
 */

interface PdfData {
  numpages: number;
  text: string;
  numrender?: number;
  info?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  version?: string;
}

export async function parsePdf(buffer: Buffer): Promise<PdfData> {
  try {
    console.log("📄 Carregando pdf-parse v1.x...");
    
    // Import dinâmico com CommonJS/ESM compatibility
    const pdfParseModule = await import("pdf-parse");
    
    // Debug: ver o que foi importado
    const moduleAsRecord = pdfParseModule as Record<string, unknown>;
    console.log("🔍 Estrutura do módulo:", {
      hasDefault: 'default' in pdfParseModule,
      keys: Object.keys(pdfParseModule),
      typeOfDefault: typeof moduleAsRecord.default,
      typeOfModule: typeof pdfParseModule,
    });
    
    // Extrair a função de parsing
    let pdfParse: ((buffer: Buffer, options?: { max?: number }) => Promise<PdfData>) | undefined;
    
    // Tentar .default primeiro (CommonJS)
    if ('default' in pdfParseModule && typeof moduleAsRecord.default === 'function') {
      pdfParse = moduleAsRecord.default as typeof pdfParse;
      console.log("✅ Usando pdfParseModule.default");
    } 
    // Se não, tentar o módulo direto
    else if (typeof pdfParseModule === 'function') {
      pdfParse = pdfParseModule as typeof pdfParse;
      console.log("✅ Usando pdfParseModule direto");
    }
    // Último recurso: procurar qualquer função exportada
    else {
      const funcKeys = Object.keys(pdfParseModule).filter(
        key => typeof moduleAsRecord[key] === 'function'
      );
      if (funcKeys.length > 0) {
        pdfParse = moduleAsRecord[funcKeys[0]] as typeof pdfParse;
        console.log(`✅ Usando função encontrada: ${funcKeys[0]}`);
      }
    }
    
    if (!pdfParse || typeof pdfParse !== 'function') {
      throw new Error("pdf-parse não exportou uma função válida");
    }
    
    console.log("📄 Parsing PDF com buffer de tamanho:", buffer.length);
    
    // Chamar pdf-parse com opções simples
    const result = await pdfParse(buffer, { max: 0 });
    
    if (!result?.text) {
      throw new Error("Falha ao extrair texto do PDF (resultado vazio)");
    }
    
    console.log(
      `✅ PDF parseado! ${result.text.length} caracteres em ${result.numpages || 0} páginas`
    );
    
    return {
      numpages: result.numpages || 0,
      text: result.text,
      numrender: result.numrender,
      info: result.info,
      metadata: result.metadata,
      version: result.version,
    };
  } catch (error) {
    console.error("❌ Erro detalhado ao processar PDF:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Falha ao processar PDF. Verifique se o arquivo é válido.");
  }
}
