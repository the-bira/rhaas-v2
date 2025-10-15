import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  name: "openai",
});

export const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const audioModels = {
  stt: "whisper-1", // ✅ Modelo correto do Whisper
  tts: "gpt-4o-mini-tts",
};

export const textModels = {
  fast: "gpt-4o-mini",
  standard: "gpt-4o",
};

export function getModel(purpose: "stt" | "tts" | "llm") {
  switch (purpose) {
    case "stt":
      return audioModels.stt;
    case "tts":
      return audioModels.tts;
    case "llm":
    default:
      return textModels.fast;
  }
}
