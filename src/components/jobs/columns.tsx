"use client";

import { Badge } from "@/components/ui/badge";
import { Job, JobTag } from "@/generated/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorkModel } from "@/enums/WorkModel";
import { JobActionsMenu } from "./JobActionsMenu";

type JobWithTags = Job & { tags?: JobTag[] };

interface Column<T> {
  accessorKey: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
}

export const columns: Column<JobWithTags>[] = [
  {
    accessorKey: "title",
    header: "Vaga",
    cell: (job) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{job.title}</span>
        {job.subtitle && (
          <span className="text-xs text-muted-foreground">{job.subtitle}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (job) => {
      if (job.publishedAt && job.isActive) {
        return <Badge variant="default">Publicada</Badge>;
      }
      if (!job.publishedAt) {
        return <Badge variant="secondary">Rascunho</Badge>;
      }
      if (!job.isActive) {
        return <Badge variant="outline">Inativa</Badge>;
      }
      return <Badge variant="secondary">-</Badge>;
    },
  },
  {
    accessorKey: "location",
    header: "Local / Modelo",
    cell: (job) => (
      <div className="flex flex-col gap-1 text-sm">
        {job.location && <span>{job.location}</span>}
        {job.workModel && job.workModel in WorkModel && (
          <Badge variant="outline" className="w-fit text-xs">
            {WorkModel[job.workModel as keyof typeof WorkModel]}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "salary",
    header: "Salário",
    cell: (job) => {
      if (job.salaryRangeMin && job.salaryRangeMax) {
        const currency = job.salaryCurrency || "BRL";
        const formatter = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
        });
        return (
          <span className="text-sm">
            {formatter.format(job.salaryRangeMin)} -{" "}
            {formatter.format(job.salaryRangeMax)}
          </span>
        );
      }
      return <span className="text-muted-foreground text-sm">-</span>;
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: (row: JobWithTags) => {
      const tags = row.tags;

      if (!tags || tags.length === 0) {
        return <span className="text-muted-foreground text-sm">Sem tags</span>;
      }

      const displayTags = tags.slice(0, 2);
      const remaining = tags.length - 2;

      return (
        <div className="flex flex-wrap gap-1">
          {displayTags.map((t: JobTag) => (
            <Badge key={t.id} variant="outline" className="text-xs">
              {t.tag}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remaining}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Criada em",
    cell: (job) =>
      format(new Date(job.createdAt), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: (job) => <JobActionsMenu job={job} />,
  },
];
