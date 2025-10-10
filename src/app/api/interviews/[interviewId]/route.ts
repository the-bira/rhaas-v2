import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { headers } from "next/headers";

/**
 * GET /api/interviews/[interviewId]
 * Retorna detalhes completos de uma entrevista incluindo análise psicológica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> }
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

    const { interviewId } = await params;

    // Buscar entrevista
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Entrevista não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se pertence ao tenant
    if (interview.tenantId !== tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar análise se entrevista completada
    let analysis = null;
    if (interview.status === "completed") {
      const assessment = await db.assessmentResult.findFirst({
        where: {
          candidateId: interview.candidateId,
          model: "BIGFIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (assessment) {
        analysis = assessment.rawJson;
      }
    }

    return NextResponse.json({
      id: interview.id,
      status: interview.status,
      kind: interview.kind,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
      vapiSessionId: interview.vapiSessionId,
      transcriptUrl: interview.transcriptUrl,
      stageScore: interview.stageScore,
      job: interview.job,
      candidate: interview.candidate,
      analysis,
    });
  } catch (error) {
    console.error("Erro ao buscar entrevista:", error);
    return NextResponse.json(
      { error: "Erro ao buscar entrevista" },
      { status: 500 }
    );
  }
}

