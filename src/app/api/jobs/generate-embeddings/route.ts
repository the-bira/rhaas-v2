import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";
import { db } from "@/db";

/**
 * API para gerar embeddings de vagas
 * POST /api/jobs/generate-embeddings
 * 
 * Body: { jobIds?: string[] } - Se não passar, processa todas as vagas sem embedding
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

    const body = await request.json().catch(() => ({}));
    let jobIds = body.jobIds;

    // Se não passou jobIds, buscar todas as vagas do tenant sem embedding
    if (!jobIds || jobIds.length === 0) {
      const jobs = await db.job.findMany({
        where: {
          tenantId,
        },
        select: {
          id: true,
        },
      });

      jobIds = jobs.map((job) => job.id);
    }

    if (jobIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma vaga para processar",
        queued: 0,
      });
    }

    // Enfileirar geração de embeddings
    const result = await inngest.send({
      name: "jobs/generate-embeddings",
      data: {
        jobIds,
      },
    });

    return NextResponse.json({
      success: true,
      queued: jobIds.length,
      inngestEventIds: result.ids,
    });
  } catch (error) {
    console.error("Erro ao enfileirar geração de embeddings:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

