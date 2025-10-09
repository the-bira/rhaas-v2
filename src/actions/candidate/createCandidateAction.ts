"use server";

import { db } from "@/db";
import { vercelBlobUpload } from "@/lib/vercelBlobUpload";
import { inngest } from "@/lib/inngest/client";

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

    // 🚀 Enfileirar processamento em background com Inngest
    try {
      await inngest.send({
        name: "candidate/process.requested",
        data: {
          candidateId: candidate.id,
          jobId,
        },
      });
      console.log(
        `✅ Candidato ${candidate.id} enfileirado para processamento`
      );
    } catch (error) {
      console.error("⚠️ Erro ao enfileirar processamento:", error);
      // Não falhamos a criação se o enfileiramento falhar
      // O cron job pegará depois
    }

    return { success: true, candidate, application };
  } catch (error) {
    console.error("Erro ao criar candidato:", error);
    throw new Error("Erro ao criar candidato");
  }
}

