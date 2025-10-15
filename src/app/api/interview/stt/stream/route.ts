import { NextResponse } from "next/server";
import { experimental_transcribe as transcribe } from "ai";
import { groqProvider } from "@/core/ai/provider";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("🎧 Recebido arquivo:", file.name, file.type, file.size);

    // Converte para buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log("📤 Enviando para Groq Whisper (10x mais rápido)");

    // ✅ Usa Groq com Whisper Large v3 Turbo (muito mais rápido e tolerante)
    const transcript = await transcribe({
      model: groqProvider.transcription("whisper-large-v3-turbo"),
      audio: buffer,
    });

    const text = transcript.text;
    console.log("🗣️ Texto transcrito:", text);

    return NextResponse.json({ text });
  } catch (err) {
    const errorMsg =
      err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
        ? (err as { message: string }).message
        : String(err);

    console.error("❌ STT error:", errorMsg);
    return NextResponse.json(
      {
        error: "STT failed",
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}