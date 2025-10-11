import { Inngest } from "inngest";

/**
 * Cliente Inngest para RHaaS
 * Gerencia processamento em background de candidatos, embeddings, etc
 * 
 * Os tipos de eventos são inferidos automaticamente pelas funções
 */
export const inngest = new Inngest({
  id: "rhaas-v2",
  name: "RHaaS - Recrutamento Inteligente",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

