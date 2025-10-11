"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Eye, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Candidate } from "@prisma/client";
import { toast } from "sonner";
import { deleteCandidateAction } from "@/actions/candidate/deleteCandidateAction";

interface CandidateWithScore {
  applicationId: string;
  applicationStatus: string;
  applicationDate: Date;
  message: string | null;
  candidate: Candidate;
  score: number | null;
  scoreDetails: Record<string, unknown> | null;
  overall: number | null;
}

interface CandidatesDataTableProps {
  candidates: CandidateWithScore[];
  jobId: string;
  onViewCandidate?: (candidateId: string) => void;
  onDelete?: () => void;
}

export function CandidatesDataTable({
  candidates,
  jobId,
  onViewCandidate,
  onDelete,
}: CandidatesDataTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [pageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(0);

  const handleDeleteClick = (candidateId: string) => {
    setCandidateToDelete(candidateId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!candidateToDelete) return;

    startTransition(async () => {
      try {
        await deleteCandidateAction(candidateToDelete, jobId);
        toast.success("Candidato removido desta vaga");
        setDeleteDialogOpen(false);
        setCandidateToDelete(null);
        onDelete?.();
      } catch {
        toast.error("Erro ao remover candidato");
      }
    });
  };

  const totalPages = Math.ceil(candidates.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = currentPage * pageSize;
    return candidates.slice(start, start + pageSize);
  }, [candidates, currentPage, pageSize]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
    > = {
      pending: { label: "Pendente", variant: "secondary" },
      reviewing: { label: "Em análise", variant: "default" },
      accepted: { label: "Aceito", variant: "default" },
      rejected: { label: "Rejeitado", variant: "destructive" },
      error: { label: "Erro", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[140px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <TableRow key={item.applicationId}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {item.candidate.name || "Sem nome"}
                      </span>
                      {item.candidate.linkedinUrl && (
                        <a
                          href={item.candidate.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.candidate.email || "-"}
                  </TableCell>
                  <TableCell>
                    {item.score !== null ? (
                      <div className="flex flex-col gap-2 w-24">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {Math.round(item.score)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /100
                          </span>
                        </div>
                        <Progress value={item.score} className="h-2" />
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Processando...
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.applicationStatus)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(item.applicationDate), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewCandidate?.(item.candidate.id)}
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {item.candidate.resumeUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(item.candidate.resumeUrl || "", "_blank")
                          }
                          title="Ver currículo"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(item.candidate.id)}
                        title="Remover candidato"
                        className="text-destructive hover:text-destructive"
                        disabled={isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum candidato encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {currentPage * pageSize + 1} -{" "}
            {Math.min((currentPage + 1) * pageSize, candidates.length)} de{" "}
            {candidates.length} candidatos
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <span className="text-sm">
              Página {currentPage + 1} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
              }
              disabled={currentPage >= totalPages - 1}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este candidato da vaga? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
