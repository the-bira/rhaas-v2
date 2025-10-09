"use client";

import { Badge } from "@/components/ui/badge";
import { Job, JobTag } from "@/generated/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";


type JobWithTags = Job & { tags?: JobTag[] };

interface Column<T> {
  accessorKey: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
}

export const columns: Column<JobWithTags>[] = [
  {
    accessorKey: "title",
    header: "Título",
    cell: (job) => <span className="font-medium">{job.title}</span>,
  },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: (job) => (
  //     <Badge
  //       variant={job.status === "OPEN" ? "default" : "secondary"}
  //       className="capitalize"
  //     >
  //       {job.status === "OPEN" ? "Aberta" : "Encerrada"}
  //     </Badge>
  //   ),
  // },
  {
    accessorKey: "createdAt",
    header: "Criada em",
    cell: (job) =>
      format(new Date(job.createdAt), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: (row: JobWithTags) => {
      const tags = row.tags;

      if (!tags || tags.length === 0) {
        return (
          <span className="text-muted-foreground text-sm">Sem tags</span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((t: JobTag) => (
            <Badge key={t.id} variant="outline">
              {t.tag}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "",
    cell: () => (
      <Button size="icon" variant="ghost">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    ),
  },
];
