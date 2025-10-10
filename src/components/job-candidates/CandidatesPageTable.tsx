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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Trash2,
  UserCheck,
  Search,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Candidate } from "@/generated/prisma";
import { toast } from "sonner";
import { deleteCandidateAction } from "@/actions/candidate/deleteCandidateAction";
import { approveForInterviewAction } from "@/actions/candidate/approveForInterviewAction";
import { CandidateDetailDialog } from "@/components/jobs/CandidateDetailDialog";
import { useRouter } from "next/navigation";

interface CandidateWithData {
  applicationId: string;
  applicationStatus: string;
  applicationDate: Date;
  message: string | null;
  candidate: Candidate;
  score: number | null;
  scoreDetails: unknown;
  overall: number | null;
  interview: {
    id: string;
    status: string;
    createdAt: Date;
  } | null;
}

interface CandidatesPageTableProps {
  candidates: CandidateWithData[];
  jobId: string;
}

export function CandidatesPageTable({
  candidates,
  jobId,
}: CandidatesPageTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  
  // Filtros locais
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  // Paginação
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  // Aplicar filtros
  const filteredCandidates = React.useMemo(() => {
    let filtered = candidates;

    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.candidate.name?.toLowerCase().includes(search) ||
          c.candidate.email?.toLowerCase().includes(search)
      );
    }

    // Filtro de status de aplicação
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.applicationStatus === statusFilter);
    }

    // Filtro de score
    if (scoreFilter === "high") {
      filtered = filtered.filter((c) => c.score !== null && c.score >= 75);
    } else if (scoreFilter === "medium") {
      filtered = filtered.filter(
        (c) => c.score !== null && c.score >= 60 && c.score < 75
      );
    } else if (scoreFilter === "low") {
      filtered = filtered.filter((c) => c.score !== null && c.score < 60);
    } else if (scoreFilter === "pending") {
      filtered = filtered.filter((c) => c.score === null);
    }

    return filtered;
  }, [candidates, searchTerm, statusFilter, scoreFilter]);

  const totalPages = Math.ceil(filteredCandidates.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = currentPage * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage, pageSize]);

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
        router.refresh();
      } catch {
        toast.error("Erro ao remover candidato");
      }
    });
  };

  const handleApproveForInterview = (candidateId: string) => {
    startTransition(async () => {
      try {
        const result = await approveForInterviewAction(candidateId, jobId);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        // Mostrar token se email falhar
        if (result.interview.accessToken) {
          toast.success(result.message, { duration: 10000 });
        } else {
          toast.success(result.message);
        }

        router.refresh();
      } catch (error) {
        console.error("Erro ao aprovar candidato:", error);
        toast.error("Erro ao aprovar candidato para entrevista");
      }
    });
  };

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

  const getInterviewStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Sem entrevista</Badge>;

    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon?: React.ReactNode }
    > = {
      scheduled: { label: "Agendada", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      in_progress: { label: "Em andamento", variant: "default", icon: <Clock className="w-3 h-3" /> },
      processing: { label: "Processando", variant: "secondary" },
      completed: { label: "Concluída", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
      cancelled: { label: "Cancelada", variant: "outline" },
      error: { label: "Erro", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-8"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="reviewing">Em análise</SelectItem>
              <SelectItem value="accepted">Aceito</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os scores</SelectItem>
              <SelectItem value="high">Alto (&gt;= 75)</SelectItem>
              <SelectItem value="medium">Médio (60-74)</SelectItem>
              <SelectItem value="low">Baixo (&lt; 60)</SelectItem>
              <SelectItem value="pending">Processando</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidato</TableHead>
                <TableHead>Score Currículo</TableHead>
                <TableHead>Status Aplicação</TableHead>
                <TableHead>Status Entrevista</TableHead>
                <TableHead>Data Aplicação</TableHead>
                <TableHead className="w-[180px]">Ações</TableHead>
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
                        <span className="text-xs text-muted-foreground">
                          {item.candidate.email || "-"}
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
                    <TableCell>
                      {getInterviewStatusBadge(item.interview?.status || null)}
                    </TableCell>
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
                          onClick={() => setSelectedCandidateId(item.candidate.id)}
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
                        {/* Botão de aprovar para entrevista */}
                        {!item.interview && item.score !== null && item.score >= 60 && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveForInterview(item.candidate.id)}
                            title="Aprovar para entrevista"
                            disabled={isPending}
                            className="gap-1"
                          >
                            <UserCheck className="w-4 h-4" />
                            Entrevista
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
                    {searchTerm || statusFilter !== "all" || scoreFilter !== "all"
                      ? "Nenhum candidato encontrado com os filtros aplicados"
                      : "Nenhum candidato se candidatou ainda"}
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
              {Math.min((currentPage + 1) * pageSize, filteredCandidates.length)} de{" "}
              {filteredCandidates.length} candidatos
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
      </div>

      {/* Dialog de Detalhes do Candidato */}
      {selectedCandidateId && (
        <CandidateDetailDialog
          candidateId={selectedCandidateId}
          jobId={jobId}
          open={!!selectedCandidateId}
          onOpenChange={(open) => !open && setSelectedCandidateId(null)}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
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
    </>
  );
}

