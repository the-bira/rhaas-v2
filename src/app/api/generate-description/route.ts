import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { headers } from "next/headers";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      throw new Error("Tenant ID is not defined in headers.");
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    });

    const companyDescription = tenant?.about ?? "";
    const companyLongDescription = tenant?.longDescription ?? "";
    const companyName = tenant?.name ?? "";

    const { title, tags } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
Você é um especialista em recrutamento e copywriting para vagas de tecnologia.

Gere uma resposta **exclusivamente em formato JSON válido**, com as seguintes chaves:
{
  "description": "<html semântico sobre a empresa e sobre a vaga>",
  "requirements": "<html com lista de requisitos e qualificações>",
  "responsibilities": "<html com lista de responsabilidades>"
}

⚙️ **Regras obrigatórias**:
- Cada valor deve ser um texto HTML válido (sem <html>, <body> ou <div>).
- Use apenas tags semânticas compatíveis com rich text (<h1>-<h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>, <br>).
- Emojis são permitidos.
- Linguagem em **português brasileiro**, tom profissional e atraente.
- O campo "description" deve conter duas seções: “💼 Sobre a empresa” e “✨ Sobre a vaga” minimo 2000 caracteres.
- O campo "requirements" deve conter “🧠 Requisitos” e uma lista <ul>.
- O campo "responsibilities" deve conter “🚀 Responsabilidades” e uma lista <ul>.
- Não inclua nada fora do objeto JSON (sem comentários, nem explicações).

📊 **Dados da vaga**:
- Título: ${title}
- Tags: ${tags}
- Empresa: ${companyName}
- Descrição curta da empresa: ${companyDescription}
- Descrição longa da empresa: ${companyLongDescription}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // tenta fazer o parse seguro do JSON (Gemini às vezes adiciona \`\`\`)
    const cleaned = text
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    const json = JSON.parse(cleaned);

    return NextResponse.json(json);
  } catch (error) {
    console.error("❌ ERRO GEMINI:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
