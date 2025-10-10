import { NextResponse } from "next/server";
import { db } from "@/db";
import { headers } from "next/headers";

/**
 * GET /api/jobs/[jobId]/candidates
 * Retorna todos os candidatos de uma vaga com seus scores
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string}> }
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

    const { jobId } = await params;

    // Buscar candidaturas da vaga com candidato e score
    const applications = await db.jobApplication.findMany({
      where: {
        jobId,
      },
      include: {
        candidate: true,
        job: {
          select: {
            tenantId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Verificar se a vaga pertence ao tenant
    if (applications.length > 0 && applications[0].job.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    // Buscar scores dos candidatos
    const candidatesWithScores = await Promise.all(
      applications.map(async (app) => {
        const finalScore = await db.finalScore.findFirst({
          where: {
            candidateId: app.candidateId,
            jobId,
          },
        });

        return {
          applicationId: app.id,
          applicationStatus: app.status,
          applicationDate: app.createdAt,
          message: app.message,
          candidate: app.candidate,
          score: finalScore?.resumeScore || null,
          scoreDetails: finalScore?.detailsJson || null,
          overall: finalScore?.overall || null,
        };
      })
    );

    // Ordenar por score (maior primeiro)
    const sorted = candidatesWithScores.sort((a, b) => {
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });

    return NextResponse.json({
      jobId,
      total: sorted.length,
      candidates: sorted,
    });
  } catch (error) {
    console.error("Erro ao buscar candidatos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidatos" },
      { status: 500 }
    );
  }
}

