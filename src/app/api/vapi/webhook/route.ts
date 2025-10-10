/**
 * Webhook do Vapi - Recebe eventos da plataforma
 * 
 * Eventos importantes:
 * - call.started: Entrevista iniciou
 * - call.ended: Entrevista terminou (dispara análise)
 * - transcript.available: Transcript disponível
 * - error: Erro durante a chamada
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/vapi/webhook
 * Recebe eventos do Vapi sobre entrevistas em andamento
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log("📞 Vapi Webhook recebido:", {
      type: payload.type,
      callId: payload.call?.id,
      timestamp: new Date().toISOString(),
    });

    // Validar assinatura do Vapi (se configurado)
    const signature = request.headers.get("x-vapi-signature");
    if (process.env.VAPI_WEBHOOK_SECRET && signature) {
      // TODO: Implementar validação de assinatura
      // const isValid = validateVapiSignature(payload, signature);
      // if (!isValid) {
      //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      // }
    }

    // Processar evento baseado no tipo
    switch (payload.type) {
      case "call.started":
        await handleCallStarted(payload);
        break;

      case "call.ended":
        await handleCallEnded(payload);
        break;

      case "transcript.available":
        await handleTranscriptAvailable(payload);
        break;

      case "error":
        await handleError(payload);
        break;

      default:
        console.log(`⚠️ Evento não tratado: ${payload.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro no webhook Vapi:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Quando a chamada inicia
 */
async function handleCallStarted(payload: VapiWebhookPayload) {
  console.log(`✅ Entrevista iniciada: ${payload.call.id}`);

  // Buscar Interview pelo vapiSessionId
  const interview = await db.interview.findFirst({
    where: {
      vapiSessionId: payload.call.id,
    },
  });

  if (interview) {
    await db.interview.update({
      where: { id: interview.id },
      data: {
        status: "in_progress",
      },
    });
  }
}

/**
 * Quando a chamada termina - AÇÃO PRINCIPAL
 * Dispara análise da entrevista via Inngest
 */
async function handleCallEnded(payload: VapiWebhookPayload) {
  console.log(`🏁 Entrevista finalizada: ${payload.call.id}`);

  // Buscar Interview pelo vapiSessionId
  const interview = await db.interview.findFirst({
    where: {
      vapiSessionId: payload.call.id,
    },
  });

  if (!interview) {
    console.error(`❌ Interview não encontrada para callId: ${payload.call.id}`);
    return;
  }

  // Atualizar status da entrevista
  await db.interview.update({
    where: { id: interview.id },
    data: {
      status: "processing",
    },
  });

  // Extrair transcript se disponível
  let transcript = "";
  
  if (payload.call.transcript) {
    // Transcript pode vir como string ou array de mensagens
    if (typeof payload.call.transcript === "string") {
      transcript = payload.call.transcript;
    } else if (Array.isArray(payload.call.transcript)) {
      transcript = payload.call.transcript
        .map((msg: TranscriptMessage) => `${msg.role}: ${msg.content}`)
        .join("\n\n");
    }
  }

  // Se não tem transcript ainda, aguardar evento transcript.available
  if (!transcript) {
    console.log("⏳ Aguardando transcript...");
    return;
  }

  // Salvar transcript URL se fornecido
  if (payload.call.recordingUrl) {
    await db.interview.update({
      where: { id: interview.id },
      data: {
        transcriptUrl: payload.call.recordingUrl,
      },
    });
  }

  // 🧠 Disparar análise da entrevista via Inngest
  console.log(`🧠 Disparando análise para entrevista ${interview.id}`);
  
  await inngest.send({
    name: "interview/analyze.requested",
    data: {
      interviewId: interview.id,
      transcript,
    },
  });
}

/**
 * Quando transcript fica disponível (pode vir separado de call.ended)
 */
async function handleTranscriptAvailable(payload: VapiWebhookPayload) {
  console.log(`📝 Transcript disponível: ${payload.call.id}`);

  const interview = await db.interview.findFirst({
    where: {
      vapiSessionId: payload.call.id,
    },
  });

  if (!interview) {
    console.error(`❌ Interview não encontrada para callId: ${payload.call.id}`);
    return;
  }

  // Extrair transcript
  let transcript = "";
  
  if (payload.call.transcript) {
    if (typeof payload.call.transcript === "string") {
      transcript = payload.call.transcript;
    } else if (Array.isArray(payload.call.transcript)) {
      transcript = payload.call.transcript
        .map((msg: TranscriptMessage) => `${msg.role}: ${msg.content}`)
        .join("\n\n");
    }
  }

  if (transcript && interview.status !== "completed" && interview.status !== "processing") {
    // Salvar transcript e disparar análise
    await db.interview.update({
      where: { id: interview.id },
      data: {
        status: "processing",
        transcriptUrl: payload.call.recordingUrl,
      },
    });

    console.log(`🧠 Disparando análise para entrevista ${interview.id}`);
    
    await inngest.send({
      name: "interview/analyze.requested",
      data: {
        interviewId: interview.id,
        transcript,
      },
    });
  }
}

/**
 * Quando ocorre erro na chamada
 */
async function handleError(payload: VapiWebhookPayload) {
  console.error(`❌ Erro na entrevista: ${payload.call.id}`, payload.error);

  const interview = await db.interview.findFirst({
    where: {
      vapiSessionId: payload.call.id,
    },
  });

  if (interview) {
    await db.interview.update({
      where: { id: interview.id },
      data: {
        status: "error",
      },
    });
  }
}

// ============================================================================
// TIPOS
// ============================================================================

interface TranscriptMessage {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
}

interface VapiWebhookPayload {
  type: "call.started" | "call.ended" | "transcript.available" | "error";
  call: {
    id: string;
    status?: string;
    transcript?: string | TranscriptMessage[];
    recordingUrl?: string;
    duration?: number;
    endedReason?: string;
  };
  error?: {
    message: string;
    code?: string;
  };
  timestamp: string;
}

