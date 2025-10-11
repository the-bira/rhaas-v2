import Vapi from "@vapi-ai/web";

const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

console.log(
  "🔑 Vapi token no SDK:",
  vapiToken ? "✅ Configurado" : "❌ Não configurado"
);

if (!vapiToken) {
  console.error("❌ NEXT_PUBLIC_VAPI_WEB_TOKEN não está configurado");
  throw new Error("NEXT_PUBLIC_VAPI_WEB_TOKEN não está configurado");
}

export const vapi = new Vapi(vapiToken);

console.log("✅ Vapi SDK inicializado:", !!vapi);
