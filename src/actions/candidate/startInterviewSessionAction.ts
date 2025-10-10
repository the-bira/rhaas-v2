"use server";

import { db } from "@/db";
import { createWebCallLink } from "@/lib/vapi/startInterview";
import type { InterviewScript } from "@/types/interview.index";

/**
 * Inicia sessão Vapi quando candidato clica em "Iniciar Entrevista"
 * 
 * Esta action só deve ser chamada quando o candidato está pronto para começar.
 * Evita criar sessões abertas desnecessariamente.
 * 
 * @param accessToken - Token único de acesso à entrevista
 * @returns Session ID e dados da chamada
 */
export async function startInterviewSessionAction(
  accessToken: string
): Promise<StartInterviewSessionResult> {
  // 1. Buscar entrevista pelo token (segurança)
  const interview = await db.interview.findUnique({
    where: { accessToken },
    include: {
      job: true,
      candidate: true,
    },
  });

  if (!interview) {
    return {
      success: false,
      error: "Entrevista não encontrada",
    };
  }

  // 2. Validar status
  if (interview.status === "completed") {
    return {
      success: false,
      error: "Esta entrevista já foi completada",
    };
  }

  if (interview.status === "cancelled") {
    return {
      success: false,
      error: "Esta entrevista foi cancelada",
    };
  }

  if (interview.status === "in_progress" && interview.vapiSessionId) {
    // Sessão já existe, retornar dados existentes
    return {
      success: true,
      sessionId: interview.vapiSessionId,
      message: "Reconectando à entrevista em andamento...",
    };
  }

  // 3. Verificar se vaga tem roteiro
  if (!interview.job.interviewScriptJson) {
    return {
      success: false,
      error: "Roteiro de entrevista não disponível. Entre em contato com o recrutador.",
    };
  }

  const script = interview.job.interviewScriptJson as unknown as InterviewScript;

  // 4. Criar sessão Vapi
  let vapiSessionId: string;

  try {
    const { callId } = await createWebCallLink({
      interviewId: interview.id,
      script,
      candidateName: interview.candidate.name || "Candidato",
    });

    vapiSessionId = callId;
  } catch (error) {
    console.error("❌ Erro ao criar sessão Vapi:", error);
    
    // Marcar interview como erro
    await db.interview.update({
      where: { id: interview.id },
      data: {
        status: "error",
      },
    });

    return {
      success: false,
      error: "Não foi possível iniciar a entrevista. Tente novamente em alguns instantes.",
    };
  }

  // 5. Salvar sessionId e atualizar status
  await db.interview.update({
    where: { id: interview.id },
    data: {
      vapiSessionId,
      status: "in_progress",
    },
  });

  console.log(`✅ Sessão Vapi iniciada: ${vapiSessionId} para entrevista ${interview.id}`);

  return {
    success: true,
    sessionId: vapiSessionId,
    message: "Entrevista iniciada com sucesso!",
  };
}

/**
 * Busca dados de uma entrevista para exibir na página
 * Usa token de acesso para segurança (só candidato correto acessa)
 * 
 * @param accessToken - Token único da entrevista
 * @returns Dados da entrevista (sem informações sensíveis do tenant)
 */
export async function getInterviewForCandidateAction(
  accessToken: string
): Promise<GetInterviewResult> {
  const interview = await db.interview.findUnique({
    where: { accessToken },
    include: {
      job: {
        select: {
          title: true,
          description: true,
        },
      },
      candidate: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!interview) {
    return {
      success: false,
      error: "Entrevista não encontrada",
    };
  }

  return {
    success: true,
    interview: {
      id: interview.id,
      status: interview.status,
      vapiSessionId: interview.vapiSessionId,
      jobTitle: interview.job.title,
      candidateName: interview.candidate.name,
    },
  };
}

// ============================================================================
// TIPOS
// ============================================================================

type StartInterviewSessionResult =
  | {
      success: true;
      sessionId: string;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

type GetInterviewResult =
  | {
      success: true;
      interview: {
        id: string;
        status: string;
        vapiSessionId: string | null;
        jobTitle: string;
        candidateName: string | null;
      };
    }
  | {
      success: false;
      error: string;
    };

