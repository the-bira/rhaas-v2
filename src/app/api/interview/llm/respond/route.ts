import { streamText } from "ai";
import { openaiProvider, getModel } from "@/core/ai/provider";

export async function POST(req: Request) {
  try {
    const { transcript, context } = await req.json();

    const prompt = `
Você é uma entrevistadora de RH comportamental e técnica.
Seu papel é conduzir entrevistas humanas, naturais e empáticas.
Baseie-se no contexto abaixo e gere uma resposta breve, em tom de conversa.
Se o candidato parecer nervoso ou fugir do assunto, encoraje-o gentilmente.

📋 Contexto da vaga:
Cargo: ${context?.jobTitle ?? "vaga não informada"}
Nome do candidato: ${context?.candidateName ?? "Candidato"}
Resposta do candidato: "${transcript}"

🎯 Gere a próxima fala da IA (em português, tom natural e amigável):
`;

    // ✅ modelo configurado corretamente
    const result = await streamText({
      model: openaiProvider(getModel("llm")),
      prompt,
      temperature: 0.8,
      maxOutputTokens: 200,
    });

    return result.toTextStreamResponse({
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("❌ LLM error:", err);
    return new Response("Erro ao gerar resposta", { status: 500 });
  }
}
