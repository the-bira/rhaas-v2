"use server";

import { db } from "@/db";
import { vercelBlobUpload } from "@/lib/vercelBlobUpload";
import { inngest } from "@/lib/inngest/client";
import { processCandidateAction } from "./processCandidateAction";

export async function createCandidateAction(formData: FormData) {
  try {
    const jobId = formData.get("jobId") as string;
    const tenantId = formData.get("tenantId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const linkedinUrl = formData.get("linkedinUrl") as string | null;
    const message = formData.get("message") as string;
    const resumeFile = formData.get("resume") as File;

    // Validações básicas
    if (
      !jobId ||
      !tenantId ||
      !name ||
      !email ||
      !phone ||
      !message ||
      !resumeFile
    ) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    // Upload do currículo para Vercel Blob
    const resumeUrl = await vercelBlobUpload(resumeFile);

    // Criar o candidato no banco de dados
    const candidate = await db.candidate.create({
      data: {
        tenantId,
        name,
        email,
        linkedinUrl: linkedinUrl || null,
        resumeUrl,
        status: "applied",
      },
    });

    // Criar a candidatura (JobApplication) associando o candidato à vaga
    const application = await db.jobApplication.create({
      data: {
        jobId,
        candidateId: candidate.id,
        message,
        status: "pending",
      },
    });

    // 🚀 Processamento em background (duas abordagens)

    // Abordagem 1: Inngest (preferencial - com retry e monitoramento)
    let inngestQueued = false;
    try {
      await inngest.send({
        name: "candidate/process.requested",
        data: {
          candidateId: candidate.id,
          jobId,
        },
      });
      inngestQueued = true;
      console.log(`✅ Candidato ${candidate.id} enfileirado no Inngest`);
    } catch (error) {
      console.error("⚠️ Erro ao enfileirar no Inngest:", error);
    }

    // Abordagem 2: Chamada direta assíncrona não bloqueante (fallback)
    if (!inngestQueued) {
      // Fire and forget - não espera terminar, não bloqueia resposta
      processCandidateAction(candidate.id, jobId)
        .then((result) => {
          console.log(
            `✅ Candidato ${candidate.id} processado diretamente: ${result.score}/100`
          );
        })
        .catch((err) => {
          console.error(`❌ Erro ao processar candidato ${candidate.id}:`, err);
          // Erro será capturado, mas não afeta a criação
          // O cron job do Inngest pegará depois se status ainda for "pending"
        });

      console.log(
        `🔄 Candidato ${candidate.id} disparado para processamento direto (fallback)`
      );
    }

    return { success: true, candidate, application };
  } catch (error) {
    console.error("Erro ao criar candidato:", error);
    throw new Error("Erro ao criar candidato");
  }
}

