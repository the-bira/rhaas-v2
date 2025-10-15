import { openai, getModel } from "@/core/ai/provider";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const speech = await openai.audio.speech.create({
      model: getModel("tts"), // ✅ provider.ts
      voice: "alloy",
      input: text,
      response_format: "wav",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/wav" },
    });
  } catch (err) {
    console.error("❌ TTS error:", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
