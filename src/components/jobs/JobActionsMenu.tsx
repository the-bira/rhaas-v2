"use client";

import { useState, useTransition } from "react";
import { Job } from "@/generated/prisma";
import {
  Eye,
  Users,
  Power,
  PowerOff,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import {
  publishJobAction,
  deactivateJobAction,
  reactivateJobAction,
  deleteJobAction,
} from "@/actions/jobs/updateJobStatusAction";

interface JobActionsMenuProps {
  job: Job;
  onViewCandidates?: (jobId: string) => void;
}

export function JobActionsMenu({ job }: JobActionsMenuProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handlePublish = () => {
    startTransition(async () => {
      try {
        await publishJobAction(job.id);
        toast.success("Vaga publicada com sucesso!");
      } catch {
        toast.error("Erro ao publicar vaga");
      }
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      try {
        await deactivateJobAction(job.id);
        toast.success("Vaga desativada");
      } catch {
        toast.error("Erro ao desativar vaga");
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      try {
        await reactivateJobAction(job.id);
        toast.success("Vaga reativada!");
      } catch {
        toast.error("Erro ao reativar vaga");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteJobAction(job.id);
        toast.success("Vaga excluída");
        setDeleteDialogOpen(false);
      } catch {
        toast.error("Erro ao excluir vaga");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" disabled={isPending}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => window.open(`/job/${job.id}`, "_blank")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar vaga
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/job/${job.id}/candidates`}>
              <Users className="w-4 h-4 mr-2" />
              Ver candidatos
            </Link>
          </DropdownMenuItem>{" "}
          <DropdownMenuSeparator />
          {!job.publishedAt ? (
            <DropdownMenuItem onClick={handlePublish}>
              <Power className="w-4 h-4 mr-2" />
              Publicar vaga
            </DropdownMenuItem>
          ) : job.isActive ? (
            <DropdownMenuItem onClick={handleDeactivate}>
              <PowerOff className="w-4 h-4 mr-2" />
              Desativar vaga
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleReactivate}>
              <Power className="w-4 h-4 mr-2" />
              Reativar vaga
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir vaga
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a vaga &quot;{job.title}&quot;?
              Esta ação não pode ser desfeita e todos os candidatos associados
              serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

