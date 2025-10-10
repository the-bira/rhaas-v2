"use server";

import { db } from "@/db";
import { headers } from "next/headers";
import { sendInterviewInvitation, isResendConfigured } from "@/lib/resend/emailService";
import { randomBytes } from "crypto";

/**
 * Aprova candidato para próxima etapa: Entrevista Comportamental
 * 
 * Fluxo:
 * 1. Valida que candidato tem score mínimo
 * 2. Cria registro Interview no banco
 * 3. Inicia sessão Vapi (web call)
 * 4. Retorna URL para candidato iniciar entrevista
 * 
 * @param candidateId - ID do candidato
 * @param jobId - ID da vaga
 * @returns Dados da entrevista e URL de acesso
 */
export async function approveForInterviewAction(
  candidateId: string,
  jobId: string
): Promise<ApproveForInterviewResult> {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Tenant não encontrado");
  }

  // 1. Buscar candidato, vaga e score
  const [candidate, job, finalScore] = await Promise.all([
    db.candidate.findUnique({
      where: { id: candidateId },
    }),
    db.job.findUnique({
      where: { id: jobId },
    }),
    db.finalScore.findFirst({
      where: {
        candidateId,
        jobId,
      },
    }),
  ]);

  // Validações
  if (!candidate) {
    throw new Error("Candidato não encontrado");
  }

  if (!job) {
    throw new Error("Vaga não encontrada");
  }

  if (candidate.tenantId !== tenantId || job.tenantId !== tenantId) {
    throw new Error("Acesso negado");
  }

  // Validar score mínimo (opcional)
  const MIN_SCORE_FOR_INTERVIEW = 60; // Score mínimo: 60/100
  
  if (finalScore && finalScore.resumeScore) {
    if (finalScore.resumeScore < MIN_SCORE_FOR_INTERVIEW) {
      return {
        success: false,
        error: `Score insuficiente. Mínimo requerido: ${MIN_SCORE_FOR_INTERVIEW}, candidato tem: ${finalScore.resumeScore}`,
      };
    }
  }

  // Verificar se já tem entrevista agendada/em progresso
  const existingInterview = await db.interview.findFirst({
    where: {
      candidateId,
      jobId,
      kind: "BEHAVIORAL",
      status: {
        in: ["scheduled", "in_progress", "completed"],
      },
    },
  });

  if (existingInterview) {
    if (existingInterview.status === "completed") {
      return {
        success: false,
        error: "Candidato já completou a entrevista comportamental",
      };
    }

    if (existingInterview.status === "in_progress") {
      return {
        success: false,
        error: "Candidato já tem uma entrevista em andamento",
      };
    }

    // Se já tem agendada, retornar dados existentes
    return {
      success: true,
      interview: {
        id: existingInterview.id,
        status: existingInterview.status,
        vapiSessionId: existingInterview.vapiSessionId,
      },
      message: "Entrevista já estava agendada",
    };
  }

  // 2. Verificar se vaga tem roteiro de entrevista
  if (!job.interviewScriptJson) {
    return {
      success: false,
      error: "Roteiro de entrevista não foi gerado ainda. Aguarde alguns instantes e tente novamente.",
    };
  }

  // 3. Gerar token único de acesso
  const accessToken = randomBytes(32).toString("hex"); // Token de 64 caracteres

  // 4. Criar registro Interview (SEM iniciar sessão Vapi ainda)
  const interview = await db.interview.create({
    data: {
      tenantId,
      jobId,
      candidateId,
      kind: "BEHAVIORAL",
      status: "scheduled", // Agendada, aguardando candidato iniciar
      accessToken, // Token único para acesso seguro
    },
  });

  // 5. Atualizar status da aplicação
  await db.jobApplication.updateMany({
    where: {
      candidateId,
      jobId,
    },
    data: {
      status: "reviewing", // Passou para etapa de entrevista
    },
  });

  console.log(`✅ Entrevista agendada: ${interview.id} - Token: ${accessToken.substring(0, 10)}...`);

  // 6. Enviar email com link da entrevista
  if (!candidate.email) {
    return {
      success: false,
      error: "Candidato não possui email cadastrado",
    };
  }

  // Verificar se Resend está configurado
  if (!isResendConfigured()) {
    console.warn("⚠️ Resend não configurado - email não será enviado");
    console.warn(`📧 Link da entrevista (copiar manualmente): ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/interview?token=${accessToken}`);
    
    return {
      success: true,
      interview: {
        id: interview.id,
        status: interview.status,
        vapiSessionId: null,
        accessToken, // Retornar token para envio manual
      },
      message: "Entrevista agendada! ⚠️ Configure RESEND_API_KEY para envio automático de email.",
    };
  }

  const emailResult = await sendInterviewInvitation({
    candidateName: candidate.name || "Candidato",
    candidateEmail: candidate.email,
    jobTitle: job.title,
    accessToken,
    interviewId: interview.id,
  });

  if (!emailResult.success) {
    // Email falhou, mas entrevista foi criada
    console.error(`❌ Falha ao enviar email: ${emailResult.error}`);
    
    return {
      success: true,
      interview: {
        id: interview.id,
        status: interview.status,
        vapiSessionId: null,
        accessToken, // Retornar token para envio manual
      },
      message: `Entrevista agendada! Erro ao enviar email: ${emailResult.error}. Envie o link manualmente.`,
    };
  }

  console.log(`📧 Email enviado para ${candidate.email}`);

  // 7. Retornar dados (sem sessionId ainda - será criado quando candidato iniciar)
  return {
    success: true,
    interview: {
      id: interview.id,
      status: interview.status,
      vapiSessionId: null, // Será criado quando candidato clicar em "Iniciar"
    },
    message: `Entrevista agendada! Email enviado para ${candidate.email}`,
  };
}

/**
 * Cancela uma entrevista agendada
 */
export async function cancelInterviewAction(
  interviewId: string
): Promise<{ success: boolean; message?: string }> {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Tenant não encontrado");
  }

  const interview = await db.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) {
    throw new Error("Entrevista não encontrada");
  }

  if (interview.tenantId !== tenantId) {
    throw new Error("Acesso negado");
  }

  if (interview.status === "completed") {
    return {
      success: false,
      message: "Não é possível cancelar uma entrevista já completada",
    };
  }

  // Se tem sessão Vapi ativa, tentar encerrar
  if (interview.vapiSessionId && interview.status === "in_progress") {
    try {
      const { endCall } = await import("@/lib/vapi/startInterview");
      await endCall(interview.vapiSessionId);
    } catch (error) {
      console.error("Erro ao encerrar chamada Vapi:", error);
      // Continua mesmo se falhar
    }
  }

  // Atualizar status
  await db.interview.update({
    where: { id: interviewId },
    data: {
      status: "cancelled",
    },
  });

  return {
    success: true,
    message: "Entrevista cancelada com sucesso",
  };
}

// ============================================================================
// TIPOS
// ============================================================================

type ApproveForInterviewResult =
  | {
      success: true;
      interview: {
        id: string;
        status: string;
        vapiSessionId: string | null;
        accessToken?: string; // Retornado apenas se email falhar (para envio manual)
      };
      message: string;
    }
  | {
      success: false;
      error: string;
    };

