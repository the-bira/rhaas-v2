"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Briefcase,
  GraduationCap,
  Languages,
  ExternalLink,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CandidateDetailDialogProps {
  candidateId: string;
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateDetailDialog({
  candidateId,
  jobId,
  open,
  onOpenChange,
}: CandidateDetailDialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadCandidateDetails = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/candidates/${candidateId}?jobId=${jobId}`
      );
      const data = await response.json();
      setCandidate(data);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    } finally {
      setLoading(false);
    }
  }, [candidateId, jobId]);

  useEffect(() => {
    if (open && candidateId) {
      loadCandidateDetails();
    }
  }, [open, candidateId, loadCandidateDetails]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumeData = candidate?.resumeJson as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {candidate?.name || "Candidato"}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos e análise de compatibilidade
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="analysis">Análise IA</TabsTrigger>
              <TabsTrigger value="resume">Currículo PDF</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 overflow-y-auto mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {/* Informações Pessoais */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Informações de Contato
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {candidate?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{candidate.email}</span>
                        </div>
                      )}
                      {resumeData?.personalInfo?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {resumeData.personalInfo.phone}
                          </span>
                        </div>
                      )}
                      {candidate?.linkedinUrl && (
                        <div className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={candidate.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            LinkedIn <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {resumeData?.personalInfo?.location && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            📍 {resumeData.personalInfo.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Resumo Profissional */}
                  {resumeData?.summary && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Resumo</h3>
                        <p className="text-sm text-muted-foreground">
                          {resumeData.summary}
                        </p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Experiências */}
                  {resumeData?.experiences && resumeData.experiences.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Briefcase className="w-5 h-5" />
                          Experiência Profissional
                        </h3>
                        <div className="space-y-4">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {resumeData.experiences.map((exp: Record<string, any>, idx: number) => (
                            <div key={idx} className="pl-4 border-l-2 border-muted">
                              <p className="font-medium">{exp.position}</p>
                              <p className="text-sm text-muted-foreground">
                                {exp.company}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exp.startDate} - {exp.endDate || "Atual"}
                              </p>
                              {exp.description && (
                                <p className="text-sm mt-2">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Formação */}
                  {resumeData?.education && resumeData.education.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5" />
                          Formação Acadêmica
                        </h3>
                        <div className="space-y-3">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {resumeData.education.map((edu: Record<string, any>, idx: number) => (
                            <div key={idx} className="pl-4 border-l-2 border-muted">
                              <p className="font-medium">{edu.degree}</p>
                              <p className="text-sm text-muted-foreground">
                                {edu.institution}
                              </p>
                              {edu.field && (
                                <p className="text-sm">{edu.field}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {edu.startDate} - {edu.endDate}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Skills */}
                  {resumeData?.skills && resumeData.skills.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          Habilidades
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Idiomas */}
                  {resumeData?.languages && resumeData.languages.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        Idiomas
                      </h3>
                        <div className="flex flex-wrap gap-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {resumeData.languages.map((lang: Record<string, any>, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {lang.language} - {lang.proficiency}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analysis" className="flex-1 overflow-y-auto mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {candidate?.score ? (
                  <div className="space-y-6">
                    {/* Score Geral */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Score de Compatibilidade
                      </h3>
                        <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold">
                          {Math.round(candidate?.score?.resumeScore || 0)}
                        </div>
                        <div className="flex-1">
                          <Progress
                            value={candidate?.score?.resumeScore || 0}
                            className="h-4"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Pontos Fortes */}
                    {candidate?.score?.detailsJson?.strengths && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-green-600">
                          💪 Pontos Fortes
                        </h3>
                        <ul className="space-y-2">
                          {candidate?.score?.detailsJson?.strengths.map(
                            (strength: string, idx: number) => (
                              <li key={idx} className="text-sm flex gap-2">
                                <span>✓</span>
                                <span>{strength}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <Separator />

                    {/* Lacunas */}
                    {candidate?.score?.detailsJson?.gaps && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-orange-600">
                          ⚠️ Lacunas
                        </h3>
                        <ul className="space-y-2">
                          {candidate?.score?.detailsJson?.gaps.map(
                            (gap: string, idx: number) => (
                              <li key={idx} className="text-sm flex gap-2">
                                <span>-</span>
                                <span>{gap}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <Separator />

                    {/* Recomendação */}
                    {candidate?.score?.detailsJson?.recommendation && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          📋 Recomendação da IA
                        </h3>
                        <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                          {candidate?.score?.detailsJson?.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Candidato ainda não foi processado pela IA.</p>
                    <p className="text-sm mt-2">
                      O processamento acontecerá em breve automaticamente.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resume" className="flex-1 overflow-hidden mt-4">
              {candidate?.resumeUrl ? (
                <div className="h-[600px] w-full">
                  <iframe
                    src={candidate.resumeUrl}
                    className="w-full h-full border rounded-md"
                    title="Currículo PDF"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Currículo não disponível</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

