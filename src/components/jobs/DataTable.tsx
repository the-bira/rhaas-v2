"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Job, JobTag } from "@/generated/prisma";

type JobWithTags = Job & { tags?: JobTag[] };


interface Column<T> {
  accessorKey: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
}

export function DataTable<T extends JobWithTags>({
  data,
  columns,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  // const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      // const matchesStatus =
      //   statusFilter === "all" ||
      //   item.status?.toLowerCase() === statusFilter.toLowerCase();
       return matchesSearch;
    });
  }, [search, data]);

  return (
    <div className="space-y-4">
      {/* 🔍 Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vaga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value="all"
            onChange={(e) => {}}
          >
            <option value="all">Todas</option>
            <option value="open">Abertas</option>
            <option value="closed">Encerradas</option>
          </select>
        </div>

        <Button className="gap-1">
          <Plus className="w-4 h-4" /> Nova vaga
        </Button>
      </div>

      {/* 🧾 Tabela */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.accessorKey)}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((job) => (
                <TableRow
                  key={job.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.accessorKey)}>
                      {col.cell ? col.cell(job) : String(job[col.accessorKey as keyof T])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6 text-muted-foreground"
                >
                  Nenhuma vaga encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
