// app/(private)/jobs/page.tsx
import { db } from "@/db";
import { DataTable } from "@/components/jobs/DataTable";
import { columns } from "@/components/jobs/columns";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { headers } from "next/headers";

export const metadata = {
  title: "Vagas | RHwise",
  description: "Gerencie suas vagas com eficiência e design impecável",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 20;
  const search = (params.search as string) || "";
  const status = (params.status as string) || "all";

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return <div>Tenant não encontrado</div>;
  }

  // Construir filtros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    tenantId,
  };

  // Filtro de busca
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filtro de status
  if (status === "active") {
    where.isActive = true;
    where.publishedAt = { not: null };
  } else if (status === "draft") {
    where.publishedAt = null;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  // Buscar total de vagas
  const total = await db.job.count({ where });

  // Buscar vagas paginadas
  const jobs = await db.job.findMany({
    where,
    include: { tags: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <section className="flex flex-col gap-8 p-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">📋 Vagas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as suas oportunidades de trabalho.
          </p>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <DataTable
          data={jobs}
          columns={columns}
          pageCount={totalPages}
          currentPage={page}
          pageSize={pageSize}
          total={total}
        />
      </Suspense>
    </section>
  );
}
