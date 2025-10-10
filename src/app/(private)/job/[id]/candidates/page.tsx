import { db } from "@/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CandidatesPageTable } from "@/components/job-candidates/CandidatesPageTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

interface JobCandidatesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function JobCandidatesPage({
  params,
  searchParams,
}: JobCandidatesPageProps) {
  const { id: jobId } = await params;
  const filters = await searchParams;

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    redirect("/sign-in");
  }

  // Buscar vaga
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { tags: true },
  });

  if (!job) {
    redirect("/jobs");
  }

  // Verificar se pertence ao tenant
  if (job.tenantId !== tenantId) {
    redirect("/jobs");
  }

  // Filtros
  const status = (filters.status as string) || "all";
  const scoreMin = filters.scoreMin ? Number(filters.scoreMin) : undefined;
  const search = (filters.search as string) || "";

  // Buscar candidaturas da vaga
  const applications = await db.jobApplication.findMany({
    where: {
      jobId,
    },
    include: {
      candidate: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Buscar scores e entrevistas
  const candidatesWithData = await Promise.all(
    applications.map(async (app) => {
      const [finalScore, interview] = await Promise.all([
        db.finalScore.findFirst({
          where: {
            candidateId: app.candidateId,
            jobId,
          },
        }),
        db.interview.findFirst({
          where: {
            candidateId: app.candidateId,
            jobId,
            kind: "BEHAVIORAL",
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
      ]);

      return {
        applicationId: app.id,
        applicationStatus: app.status,
        applicationDate: app.createdAt,
        message: app.message,
        candidate: app.candidate,
        score: finalScore?.resumeScore || null,
        scoreDetails: finalScore?.detailsJson || null,
        overall: finalScore?.overall || null,
        interview: interview
          ? {
              id: interview.id,
              status: interview.status,
              createdAt: interview.createdAt,
            }
          : null,
      };
    })
  );

  // Aplicar filtros
  let filteredCandidates = candidatesWithData;

  // Filtro de busca
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCandidates = filteredCandidates.filter(
      (c) =>
        c.candidate.name?.toLowerCase().includes(searchLower) ||
        c.candidate.email?.toLowerCase().includes(searchLower)
    );
  }

  // Filtro de status
  if (status !== "all") {
    filteredCandidates = filteredCandidates.filter(
      (c) => c.applicationStatus === status
    );
  }

  // Filtro de score mínimo
  if (scoreMin !== undefined) {
    filteredCandidates = filteredCandidates.filter(
      (c) => c.score !== null && c.score >= scoreMin
    );
  }

  // Ordenar por score (maior primeiro)
  const sortedCandidates = filteredCandidates.sort((a, b) => {
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  return (
    <section className="flex flex-col gap-6 p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/jobs">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-semibold tracking-tight">
              Candidatos - {job.title}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {sortedCandidates.length} candidato(s) encontrado(s)
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/job/${jobId}`}>Ver vaga pública</Link>
        </Button>
      </header>

      {/* Tabela de Candidatos */}
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CandidatesPageTable candidates={sortedCandidates} jobId={jobId} />
      </Suspense>
    </section>
  );
}

