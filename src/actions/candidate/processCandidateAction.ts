"use server";

import { db } from "@/db";
import {
  parseResumeWithAI,
  generateEmbedding,
  prepareResumeForEmbedding,
  prepareJobForEmbedding,
  matchCandidateToJob,
  type ParsedResume,
} from "@/lib/geminiService";
import type { Prisma } from "@/generated/prisma";
import { parsePdf } from "@/lib/pdfParser";

/**
 * Baixa um arquivo PDF do Vercel Blob
 */
async function downloadPdfFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Processa o currículo de um candidato usando IA
 * - Faz parsing do PDF
 * - Extrai dados estruturados com IA
 * - Gera embedding vetorial
 * - Calcula score de compatibilidade com a vaga
 * - Atualiza o banco de dados
 */
export async function processCandidateAction(candidateId: string, jobId: string) {
  try {
    console.log(`🤖 Iniciando processamento do candidato ${candidateId} para vaga ${jobId}`);

    // 1. Buscar candidato
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error("Candidato não encontrado");
    }

    if (!candidate.resumeUrl) {
      throw new Error("Candidato não possui currículo anexado");
    }

    // 2. Buscar vaga
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Vaga não encontrada");
    }

    // 3. Baixar PDF do currículo
    console.log(`📥 Baixando currículo de ${candidate.resumeUrl}`);
    const pdfBuffer = await downloadPdfFromUrl(candidate.resumeUrl);

    // 4. Extrair texto do PDF
    console.log("📄 Extraindo texto do PDF...");
    const pdfData = await parsePdf(pdfBuffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error("Currículo vazio ou muito curto");
    }

    // 5. Fazer parsing estruturado com IA
    console.log("🧠 Analisando currículo com IA...");
    const parsedResume: ParsedResume = await parseResumeWithAI(resumeText);

    // 6. Gerar embedding do currículo
    console.log("🔢 Gerando embedding vetorial do currículo...");
    const resumeTextForEmbedding = prepareResumeForEmbedding(parsedResume);
    const resumeEmbedding = await generateEmbedding(resumeTextForEmbedding);

    // 7. Gerar embedding da vaga (sempre, pois não conseguimos verificar facilmente)
    console.log("🔢 Gerando embedding vetorial da vaga...");
    const jobTextForEmbedding = prepareJobForEmbedding({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      skills: job.skills,
    });
    const jobEmbedding = await generateEmbedding(jobTextForEmbedding);

    // 8. Calcular compatibilidade com a vaga
    console.log("🎯 Calculando compatibilidade candidato x vaga...");
    const matchResult = await matchCandidateToJob(parsedResume, {
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills,
    });

    // 9. Atualizar candidato no banco (resumeJson + embedding)
    console.log("💾 Salvando dados estruturados no banco...");
    
    // Atualizar campos normais
    await db.candidate.update({
      where: { id: candidateId },
      data: {
        resumeJson: parsedResume as unknown as Prisma.InputJsonValue,
        name: parsedResume.personalInfo?.name || candidate.name,
        email: parsedResume.personalInfo?.email || candidate.email,
        linkedinUrl: parsedResume.personalInfo?.linkedin || candidate.linkedinUrl,
      },
    });

    // Atualizar embedding usando SQL raw (tipo Unsupported do Prisma)
    await db.$executeRaw`
      UPDATE "Candidate" 
      SET embedding = ${`[${resumeEmbedding.join(",")}]`}::vector 
      WHERE id = ${candidateId}
    `;

    // 10. Atualizar vaga com embedding
    await db.$executeRaw`
      UPDATE "Job" 
      SET embedding = ${`[${jobEmbedding.join(",")}]`}::vector 
      WHERE id = ${jobId}
    `;

    // 11. Criar ou atualizar FinalScore
    console.log(`📊 Salvando score: ${matchResult.score}/100`);
    const existingScore = await db.finalScore.findFirst({
      where: {
        jobId,
        candidateId,
      },
    });

    const scoreData = {
      tenantId: candidate.tenantId,
      jobId,
      candidateId,
      resumeScore: matchResult.score,
      detailsJson: {
        strengths: matchResult.strengths,
        gaps: matchResult.gaps,
        recommendation: matchResult.recommendation,
        processedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    };

    if (existingScore) {
      await db.finalScore.update({
        where: { id: existingScore.id },
        data: scoreData,
      });
    } else {
      await db.finalScore.create({
        data: scoreData,
      });
    }

    // 12. Atualizar status da candidatura
    await db.jobApplication.updateMany({
      where: {
        jobId,
        candidateId,
      },
      data: {
        status: "reviewing",
      },
    });

    console.log(`✅ Processamento concluído! Score: ${matchResult.score}/100`);

    return {
      success: true,
      candidateId,
      jobId,
      score: matchResult.score,
      strengths: matchResult.strengths,
      gaps: matchResult.gaps,
      recommendation: matchResult.recommendation,
    };
  } catch (error) {
    console.error("❌ Erro ao processar candidato:", error);
    
    // Atualizar status para error
    await db.jobApplication.updateMany({
      where: {
        jobId,
        candidateId,
      },
      data: {
        status: "error",
      },
    }).catch(() => {
      // Ignorar erro ao atualizar status
    });

    throw error;
  }
}

/**
 * Processa múltiplos candidatos em lote
 * Útil para processar candidaturas antigas ou reprocessar
 */
export async function processCandidatesBatch(
  candidateIds: string[],
  jobId: string
): Promise<{ 
  success: number; 
  failed: number; 
  results: Array<{
    candidateId: string;
    status: "success" | "error";
    result?: unknown;
    error?: string;
  }>;
}> {
  const results = [];
  let success = 0;
  let failed = 0;

  for (const candidateId of candidateIds) {
    try {
      const result = await processCandidateAction(candidateId, jobId);
      results.push({ candidateId, status: "success" as const, result });
      success++;
    } catch (error) {
      results.push({
        candidateId,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failed++;
    }
  }

  return { success, failed, results };
}

