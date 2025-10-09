import { inngest } from "./client";
import { processCandidateAction } from "@/actions/candidate/processCandidateAction";
import { db } from "@/db";

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

    console.log(`🤖 Inngest: Processando candidato ${candidateId} para vaga ${jobId}`);

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
      console.log(`✅ Candidato ${candidateId} processado com sucesso!`);
      console.log(`📊 Score: ${result.score}/100`);
      console.log(`💪 Pontos fortes: ${result.strengths.join(", ")}`);
      console.log(`⚠️ Gaps: ${result.gaps.join(", ")}`);
      
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

    console.log(`🔄 Reprocessando ${candidateIds.length} candidatos para vaga ${jobId}`);

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

    console.log(`🚀 ${pendingApplications.length} candidatos enfileirados para processamento`);

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

