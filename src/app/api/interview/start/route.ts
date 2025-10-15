// /app/api/interview/start/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function PATCH(req: Request) {
  try {
    console.log("🚀 [API] Iniciando entrevista...");
    const { interviewId } = await req.json();

    if (!interviewId) {
      return NextResponse.json(
        { success: false, message: "interviewId é obrigatório" },
        { status: 400 }
      );
    }

    console.log("📝 [API] interviewId:", interviewId);

    // Atualiza status no banco
    const interview = await db.interview.update({
      where: { accessToken: interviewId },
      data: { status: "in_progress" },
    });
    console.log("✅ [API] Status atualizado no banco");

    // TEMP: Passar API key diretamente (só para teste)
    // Em produção, criar sistema de proxy ou usar abordagem diferente
    console.log("🔑 [API] Retornando API key para teste...");

    return NextResponse.json({
      success: true,
      interview,
      sessionToken: process.env.OPENAI_API_KEY, // TEMP: só para teste!
    });
  } catch (err) {
    console.error("❌ [API] Erro em /api/interview/start:", err);
    return NextResponse.json(
      { success: false, message: "Erro interno ao iniciar entrevista" },
      { status: 500 }
    );
  }
}
