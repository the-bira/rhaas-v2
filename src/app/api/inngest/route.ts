import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processCandidateFunction,
  reprocessCandidatesBatchFunction,
  processPendingCandidatesFunction,
  generateJobEmbeddingsFunction,
} from "@/lib/inngest/functions";

/**
 * Endpoint do Inngest
 * Registra todas as funções de background disponíveis
 * 
 * Após deploy, acessar em:
 * - Dev: http://localhost:3000/api/inngest
 * - Prod: https://seu-dominio.vercel.app/api/inngest
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processCandidateFunction,
    reprocessCandidatesBatchFunction,
    processPendingCandidatesFunction,
    generateJobEmbeddingsFunction,
  ],
});

