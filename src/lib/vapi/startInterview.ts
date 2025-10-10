/**
 * Helper para iniciar entrevistas via Vapi
 * 
 * Cria uma sessão de chamada com o assistente entrevistador configurado
 */

import { createInterviewAssistant, getVapiApiKey } from "./interviewAgent";
import type { InterviewScript } from "@/types/interview.index";

/**
 * Resposta da API do Vapi ao criar uma chamada
 */
export interface VapiCallResponse {
  id: string;
  status: string;
  phoneNumber?: string;
  webCallUrl?: string;
  createdAt: string;
}

/**
 * Inicia uma entrevista comportamental via Vapi
 * 
 * @param interviewId - ID da Interview no banco
 * @param script - Roteiro de entrevista gerado pela IA
 * @param candidateName - Nome do candidato
 * @param phoneNumber - Telefone do candidato (opcional, para chamada telefônica)
 * @returns Dados da sessão criada
 */
export async function startInterviewSession(params: {
  interviewId: string;
  script: InterviewScript;
  candidateName: string;
  phoneNumber?: string;
}): Promise<VapiCallResponse> {
  const { interviewId, script, candidateName, phoneNumber } = params;

  // Configurar assistente
  const assistant = createInterviewAssistant(script, candidateName);

  // Preparar payload da requisição
  const payload: VapiCreateCallPayload = {
    assistant,
    metadata: {
      interviewId,
      type: "behavioral_interview",
    },
  };

  // Se tiver número de telefone, fazer chamada telefônica
  if (phoneNumber) {
    payload.phoneNumber = phoneNumber;
    payload.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID; // Número do Vapi para fazer a chamada
  }

  // Fazer requisição para API do Vapi
  const apiKey = getVapiApiKey();
  const response = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erro ao criar chamada Vapi:", error);
    throw new Error(`Falha ao criar chamada Vapi: ${response.status} ${error}`);
  }

  const data: VapiCallResponse = await response.json();

  console.log(`✅ Sessão Vapi criada: ${data.id}`);
  
  return data;
}

/**
 * Cria um link de chamada web para o candidato
 * (Alternativa a chamada telefônica - candidato inicia pelo navegador)
 */
export async function createWebCallLink(params: {
  interviewId: string;
  script: InterviewScript;
  candidateName: string;
}): Promise<{ callId: string; webUrl: string }> {
  const { interviewId, script, candidateName } = params;

  // Configurar assistente
  const assistant = createInterviewAssistant(script, candidateName);

  // Criar chamada web
  const apiKey = getVapiApiKey();
  const response = await fetch("https://api.vapi.ai/call/web", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      assistant,
      metadata: {
        interviewId,
        type: "behavioral_interview",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Falha ao criar link web: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    callId: data.id,
    webUrl: data.webCallUrl,
  };
}

/**
 * Busca informações de uma chamada em andamento
 */
export async function getCallStatus(callId: string): Promise<VapiCallStatus> {
  const apiKey = getVapiApiKey();
  const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar status da chamada: ${response.status}`);
  }

  return await response.json();
}

/**
 * Encerra uma chamada em andamento
 */
export async function endCall(callId: string): Promise<void> {
  const apiKey = getVapiApiKey();
  const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao encerrar chamada: ${response.status}`);
  }

  console.log(`✅ Chamada ${callId} encerrada`);
}

// ============================================================================
// TIPOS
// ============================================================================

interface VapiCreateCallPayload {
  assistant: {
    name: string;
    model: {
      provider: string;
      model: string;
      messages: Array<{
        role: string;
        content: string;
      }>;
      temperature?: number;
    };
    voice: {
      provider: string;
      voiceId: string;
    };
    firstMessage?: string;
    endCallMessage?: string;
    endCallPhrases?: string[];
    recordingEnabled?: boolean;
    maxDurationSeconds?: number;
  };
  metadata?: {
    interviewId: string;
    type: string;
    [key: string]: string;
  };
  phoneNumber?: string;
  phoneNumberId?: string;
}

interface VapiCallStatus {
  id: string;
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  transcript?: string;
  recordingUrl?: string;
}

