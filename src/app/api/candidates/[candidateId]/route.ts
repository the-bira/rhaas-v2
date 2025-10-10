import { NextResponse } from "next/server";
import { db } from "@/db";
import { headers } from "next/headers";

/**
 * GET /api/candidates/[candidateId]?jobId=xxx
 * Retorna detalhes completos do candidato incluindo score
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID não encontrado" },
        { status: 401 }
      );
    }

    const { candidateId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    // Buscar candidato
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidato não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se pertence ao tenant
    if (candidate.tenantId !== tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar score se jobId fornecido
    let score = null;
    if (jobId) {
      score = await db.finalScore.findFirst({
        where: {
          candidateId,
          jobId,
        },
      });
    }

    return NextResponse.json({
      ...candidate,
      score: score || null,
    });
  } catch (error) {
    console.error("Erro ao buscar candidato:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidato" },
      { status: 500 }
    );
  }
}

