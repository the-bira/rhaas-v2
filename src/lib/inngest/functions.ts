import { inngest } from "./client";
import { processCandidateAction } from "@/actions/candidate/processCandidateAction";
import { db } from "@/db";
import { generateInterviewScript, analyzeInterview } from "@/lib/geminiService";
import {
  InterviewScriptSchema,
  InterviewAnalysisResultSchema,
} from "@/types/interview.index";

/**
 * Função principal: Processa candidato com IA
 * - Extrai dados do PDF
 * - Gera embeddings vetoriais
 * - Calcula score de compatibilidade
 * - Atualiza status no banco
 */
export const processCandidateFunction = inngest.createFunction(
  {
    id: "process-candidate",
    name: "Processar Candidato com IA",
    retries: 3,
  },
  { event: "candidate/process.requested" },
  async ({ event, step }) => {
    const { candidateId, jobId } = event.data;

    console.log(
      `🤖 Inngest: Processando candidato ${candidateId} para vaga ${jobId}`
    );

    // Step 1: Validar que candidato e vaga existem
    await step.run("validate-data", async () => {
      const candidate = await db.candidate.findUnique({
        where: { id: candidateId },
      });

      const job = await db.job.findUnique({
        where: { id: jobId },
      });

      if (!candidate || !job) {
        throw new Error("Candidato ou vaga não encontrados");
      }

      return { candidateId, jobId };
    });

    // Step 2: Processar com IA (parsing, embeddings, matching)
    const result = await step.run("process-with-ai", async () => {
      return await processCandidateAction(candidateId, jobId);
    });

    // Step 3: Log de sucesso
    await step.run("log-completion", async () => {
      // Verificar se o processamento foi bem-sucedido
      if (result.success && "strengths" in result) {
        console.log(`✅ Candidato ${candidateId} processado com sucesso!`);
        console.log(`📊 Score: ${result.score}/100`);
        console.log(`💪 Pontos fortes: ${result.strengths.join(", ")}`);
        console.log(`⚠️ Gaps: ${result.gaps.join(", ")}`);
      } else {
        console.log(
          `⚠️ Candidato ${candidateId} não processado: ${
            "reason" in result ? result.reason : "Motivo desconhecido"
          }`
        );
      }

      return {
        completed: true,
        timestamp: new Date().toISOString(),
      };
    });

    return result;
  }
);

/**
 * Função para reprocessar candidatos em lote
 * Útil para reprocessar após mudanças na vaga ou algoritmo
 */
export const reprocessCandidatesBatchFunction = inngest.createFunction(
  {
    id: "reprocess-candidates-batch",
    name: "Reprocessar Candidatos em Lote",
  },
  { event: "candidates/reprocess.batch" },
  async ({ event, step }) => {
    const { candidateIds, jobId } = event.data;

    console.log(
      `🔄 Reprocessando ${candidateIds.length} candidatos para vaga ${jobId}`
    );

    // Enfileira processamento individual de cada candidato
    const results = await step.run("enqueue-all", async () => {
      const promises = candidateIds.map((candidateId: string) =>
        inngest.send({
          name: "candidate/process.requested",
          data: { candidateId, jobId },
        })
      );

      return await Promise.all(promises);
    });

    return {
      queued: candidateIds.length,
      jobIds: results.map((r) => r.ids).flat(),
    };
  }
);

/**
 * Função para processar candidatos pendentes (cron-like)
 * Busca JobApplications com status "pending" e processa automaticamente
 */
export const processPendingCandidatesFunction = inngest.createFunction(
  {
    id: "process-pending-candidates",
    name: "Processar Candidatos Pendentes",
  },
  { cron: "*/10 * * * *" }, // A cada 10 minutos
  async ({ step }) => {
    // Buscar candidaturas pendentes
    const pendingApplications = await step.run("find-pending", async () => {
      return await db.jobApplication.findMany({
        where: {
          status: "pending",
        },
        take: 50, // Processar até 50 por vez
        orderBy: {
          createdAt: "asc",
        },
        include: {
          candidate: true,
          job: true,
        },
      });
    });

    if (pendingApplications.length === 0) {
      console.log("✅ Nenhuma candidatura pendente");
      return { processed: 0 };
    }

    // Enfileirar processamento de cada uma
    await step.run("enqueue-pending", async () => {
      const promises = pendingApplications.map((app) =>
        inngest.send({
          name: "candidate/process.requested",
          data: {
            candidateId: app.candidateId,
            jobId: app.jobId,
          },
        })
      );

      return await Promise.all(promises);
    });

    console.log(
      `🚀 ${pendingApplications.length} candidatos enfileirados para processamento`
    );

    return { queued: pendingApplications.length };
  }
);

/**
 * Função para gerar embeddings de vagas sem embedding
 * Útil para vagas antigas ou importadas
 */
export const generateJobEmbeddingsFunction = inngest.createFunction(
  {
    id: "generate-job-embeddings",
    name: "Gerar Embeddings de Vagas",
  },
  { event: "jobs/generate-embeddings" },
  async ({ event, step }) => {
    const { jobIds } = event.data;

    const results = [];

    for (const jobId of jobIds) {
      const result = await step.run(`generate-embedding-${jobId}`, async () => {
        const job = await db.job.findUnique({
          where: { id: jobId },
        });

        if (!job) {
          return { jobId, status: "not_found" };
        }

        // Importar dinamicamente para evitar circular dependency
        const { generateEmbedding, prepareJobForEmbedding } = await import(
          "@/lib/geminiService"
        );

        const jobText = prepareJobForEmbedding({
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          skills: job.skills,
        });

        const embedding = await generateEmbedding(jobText);

        await db.$executeRaw`
          UPDATE "Job" 
          SET embedding = ${`[${embedding.join(",")}]`}::vector 
          WHERE id = ${jobId}
        `;

        return { jobId, status: "completed" };
      });

      results.push(result);
    }

    return { processed: results.length, results };
  }
);

// ============================================================================
// FUNÇÕES DE ENTREVISTA COMPORTAMENTAL
// ============================================================================

/**
 * Função para gerar roteiro de entrevista comportamental
 * Acionada automaticamente após a criação de uma vaga
 * Gera roteiro personalizado baseado nos requisitos da vaga
 */
export const generateInterviewScriptFunction = inngest.createFunction(
  {
    id: "generate-interview-script",
    name: "Gerar Roteiro de Entrevista",
    retries: 2,
  },
  { event: "job/script.generate" },
  async ({ event, step }) => {
    const { jobId } = event.data;

    console.log(`🎭 Inngest: Gerando roteiro de entrevista para vaga ${jobId}`);

    // Step 1: Buscar dados da vaga
    const job = await step.run("fetch-job", async () => {
      const jobData = await db.job.findUnique({
        where: { id: jobId },
        include: { tags: true },
      });

      if (!jobData) {
        throw new Error(`Vaga ${jobId} não encontrada`);
      }

      return jobData;
    });

    // Step 2: Gerar roteiro com IA
    const script = await step.run("generate-script", async () => {
      const scriptData = await generateInterviewScript({
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        skills: job.skills,
        workModel: job.workModel,
        tags: job.tags,
      });

      return scriptData;
    });

    // Step 3: Validar roteiro gerado
    const validatedScript = await step.run("validate-script", async () => {
      const validation = InterviewScriptSchema.safeParse(script);

      if (!validation.success) {
        console.error("❌ Roteiro inválido:", validation.error);
        throw new Error("Roteiro gerado não passou na validação");
      }

      return validation.data;
    });

    // Step 4: Salvar roteiro no banco
    await step.run("save-script", async () => {
      await db.job.update({
        where: { id: jobId },
        data: {
          interviewScriptJson: validatedScript as never,
        },
      });

      console.log(`✅ Roteiro salvo para vaga ${jobId}`);
      return { saved: true };
    });

    return {
      jobId,
      success: true,
      stages: validatedScript.stages.length,
      objectives: validatedScript.objectives.length,
    };
  }
);

/**
 * Função para analisar entrevista comportamental finalizada
 * Acionada quando o Vapi notifica que a entrevista terminou
 * Gera análise psicológica completa (Big Five, DISC, etc)
 */
export const analyzeInterviewFunction = inngest.createFunction(
  {
    id: "analyze-interview",
    name: "Analisar Entrevista Comportamental",
    retries: 2,
  },
  { event: "interview/analyze.requested" },
  async ({ event, step }) => {
    const { interviewId, transcript } = event.data;

    console.log(`🧠 Inngest: Analisando entrevista ${interviewId}`);

    // Step 1: Buscar dados da entrevista
    const interview = await step.run("fetch-interview", async () => {
      const data = await db.interview.findUnique({
        where: { id: interviewId },
        include: {
          job: true,
          candidate: true,
        },
      });

      if (!data) {
        throw new Error(`Entrevista ${interviewId} não encontrada`);
      }

      return data;
    });

    // Step 2: Analisar transcript com IA
    const analysis = await step.run("analyze-transcript", async () => {
      const analysisData = await analyzeInterview(
        transcript,
        {
          title: interview.job.title,
          description: interview.job.description,
          requirements: interview.job.requirements,
        },
        {
          name: interview.candidate.name,
          email: interview.candidate.email,
        }
      );

      return analysisData;
    });

    // Step 3: Validar análise gerada
    const validatedAnalysis = await step.run("validate-analysis", async () => {
      const validation = InterviewAnalysisResultSchema.safeParse(analysis);

      if (!validation.success) {
        console.error("❌ Análise inválida:", validation.error);
        throw new Error("Análise gerada não passou na validação");
      }

      return validation.data;
    });

    // Step 4: Calcular score de fit comportamental
    const behavioralScore = await step.run(
      "calculate-behavioral-score",
      async () => {
        // Fórmula de cálculo do fit comportamental
        // Considera Big Five, DISC, motivações e riscos
        const bigFiveAvg =
          (validatedAnalysis.bigFive.openness.score +
            validatedAnalysis.bigFive.conscientiousness.score +
            validatedAnalysis.bigFive.extraversion.score +
            validatedAnalysis.bigFive.agreeableness.score +
            (100 - validatedAnalysis.bigFive.neuroticism.score)) / // Invertido
          5;

        const discAvg =
          (validatedAnalysis.disc.dominance +
            validatedAnalysis.disc.influence +
            validatedAnalysis.disc.steadiness +
            validatedAnalysis.disc.compliance) /
          4;

        const emotionalScore =
          validatedAnalysis.motivations.emotionalMaturity.score;

        // Penalizar por riscos
        const riskPenalty = validatedAnalysis.risks.reduce((acc, risk) => {
          if (risk.impact === "alto") return acc - 10;
          if (risk.impact === "médio") return acc - 5;
          return acc - 2;
        }, 0);

        const finalScore = Math.max(
          0,
          Math.min(
            100,
            bigFiveAvg * 0.4 +
              discAvg * 0.3 +
              emotionalScore * 0.3 +
              riskPenalty
          )
        );

        return Math.round(finalScore);
      }
    );

    // Step 5: Salvar análise no banco (AssessmentResult)
    await step.run("save-assessment", async () => {
      await db.assessmentResult.create({
        data: {
          tenantId: interview.tenantId,
          candidateId: interview.candidateId,
          model: "BIGFIVE",
          rawJson: validatedAnalysis as never,
          normalized: {
            bigFive: validatedAnalysis.bigFive,
            disc: validatedAnalysis.disc,
          } as never,
          fitScore: behavioralScore,
        },
      });

      console.log(`✅ Análise salva para candidato ${interview.candidateId}`);
      return { saved: true };
    });

    // Step 6: Atualizar FinalScore com score da entrevista
    await step.run("update-final-score", async () => {
      // Buscar FinalScore existente ou criar novo
      const existingScore = await db.finalScore.findFirst({
        where: {
          candidateId: interview.candidateId,
          jobId: interview.jobId,
        },
      });

      if (existingScore) {
        // Atualizar score existente
        await db.finalScore.update({
          where: { id: existingScore.id },
          data: {
            interviewScore: behavioralScore,
            discScore: behavioralScore, // Compatibilidade com campo legado
            overall: calculateOverallScore({
              resume: existingScore.resumeScore,
              interview: behavioralScore,
              tech: existingScore.techScore,
            }),
            detailsJson: {
              ...((existingScore.detailsJson as Record<string, unknown>) || {}),
              behavioralAnalysis: validatedAnalysis,
            } as never,
          },
        });
      } else {
        // Criar novo score
        await db.finalScore.create({
          data: {
            tenantId: interview.tenantId,
            candidateId: interview.candidateId,
            jobId: interview.jobId,
            interviewScore: behavioralScore,
            discScore: behavioralScore,
            overall: behavioralScore,
            detailsJson: {
              behavioralAnalysis: validatedAnalysis,
            } as never,
          },
        });
      }

      console.log(
        `✅ Score final atualizado para candidato ${interview.candidateId}`
      );
      return { updated: true };
    });

    // Step 7: Atualizar status da entrevista
    await step.run("update-interview-status", async () => {
      await db.interview.update({
        where: { id: interviewId },
        data: {
          status: "completed",
          stageScore: behavioralScore,
        },
      });

      return { updated: true };
    });

    return {
      interviewId,
      candidateId: interview.candidateId,
      success: true,
      behavioralScore,
      recommendation: validatedAnalysis.verdict.recommendation,
    };
  }
);

/**
 * Helper para calcular score geral
 */
function calculateOverallScore(scores: {
  resume?: number | null;
  interview?: number | null;
  tech?: number | null;
}): number {
  const validScores = [scores.resume, scores.interview, scores.tech].filter(
    (s): s is number => s !== null && s !== undefined
  );

  if (validScores.length === 0) return 0;

  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / validScores.length);
}

