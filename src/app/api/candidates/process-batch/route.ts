import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

/**
 * API para reprocessar candidatos em lote
 * POST /api/candidates/process-batch
 * 
 * Body: { candidateIds: string[], jobId: string }
 */
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID não encontrado" },
        { status: 401 }
      );
    }

    const { candidateIds, jobId } = await request.json();

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { error: "candidateIds é obrigatório e deve ser um array" },
        { status: 400 }
      );
    }

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId é obrigatório" },
        { status: 400 }
      );
    }

    // Enfileirar processamento em lote
    const result = await inngest.send({
      name: "candidates/reprocess.batch",
      data: {
        candidateIds,
        jobId,
      },
    });

    return NextResponse.json({
      success: true,
      queued: candidateIds.length,
      inngestEventIds: result.ids,
    });
  } catch (error) {
    console.error("Erro ao enfileirar processamento em lote:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

