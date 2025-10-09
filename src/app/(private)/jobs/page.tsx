// app/(private)/jobs/page.tsx
import { db } from "@/db";
import { DataTable } from "@/components/jobs/DataTable";
import { columns } from "@/components/jobs/columns";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Vagas | RHwise",
  description: "Gerencie suas vagas com eficiência e design impecável",
};

export default async function JobsPage() {
  const jobs = await db.job.findMany({
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });

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
        <DataTable data={jobs} columns={columns} />
      </Suspense>
    </section>
  );
}
