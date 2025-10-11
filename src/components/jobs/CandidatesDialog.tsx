"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Job } from "@prisma/client";
import { CandidatesDataTable } from "./CandidatesDataTable";
import { Loader2 } from "lucide-react";
import { CandidateDetailDialog } from "./CandidateDetailDialog";

interface CandidatesDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidatesDialog({
  job,
  open,
  onOpenChange,
}: CandidatesDialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const loadCandidates = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/candidates`);
      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error("Erro ao carregar candidatos:", error);
    } finally {
      setLoading(false);
    }
  }, [job.id]);

  useEffect(() => {
    if (open) {
      loadCandidates();
    }
  }, [open, loadCandidates]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Candidatos - {job.title}</DialogTitle>
            <DialogDescription>
              {candidates.length} candidato(s) encontrado(s)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CandidatesDataTable
                candidates={candidates}
                jobId={job.id}
                onViewCandidate={setSelectedCandidateId}
                onDelete={loadCandidates}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedCandidateId && (
        <CandidateDetailDialog
          candidateId={selectedCandidateId}
          jobId={job.id}
          open={!!selectedCandidateId}
          onOpenChange={(open) => !open && setSelectedCandidateId(null)}
        />
      )}
    </>
  );
}

