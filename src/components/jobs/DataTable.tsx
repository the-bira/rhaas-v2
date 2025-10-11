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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Job, JobTag } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type JobWithTags = Job & { tags?: JobTag[] };

interface Column<T> {
  accessorKey: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageCount?: number;
  currentPage?: number;
  pageSize?: number;
  total?: number;
}

export function DataTable<T extends JobWithTags>({
  data,
  columns,
  pageCount = 1,
  currentPage: serverPage = 1,
  pageSize: serverPageSize = 20,
  total = 0,
}: DataTableProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = React.useState<string>(
    searchParams.get("status") || "all"
  );
  const [pageSize, setPageSize] = React.useState<number>(serverPageSize);

  const currentPage = serverPage;
  const totalPages = pageCount;

  // Atualizar URL quando filtros mudarem
  const updateFilters = React.useCallback(
    (updates: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      router.push(`/jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounce da busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get("search") || "")) {
        updateFilters({ search, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, searchParams, updateFilters]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateFilters({ status: value, page: 1 });
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    updateFilters({ pageSize: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  return (
    <div className="space-y-4">
      {/* 🔍 Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vaga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Publicadas</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-1" asChild>
          <Link href="/jobs/new">
            <Plus className="w-4 h-4" /> Nova vaga
          </Link>
        </Button>
      </div>

      {/* 🧾 Tabela */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.accessorKey)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((job) => (
                <TableRow
                  key={job.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.accessorKey)}>
                      {col.cell
                        ? col.cell(job)
                        : String(job[col.accessorKey as keyof T])}
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

      {/* 📄 Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, total)} de {total} vagas
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
