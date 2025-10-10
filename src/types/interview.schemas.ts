/**
 * Schemas Zod para validação dos tipos de entrevista
 * 
 * Usado para validar:
 * - Roteiros gerados pela IA
 * - Turnos da entrevista
 * - Análises psicológicas
 * - Payloads de API
 */

import { z } from "zod";

// ============================================================================
// ROTEIRO DE ENTREVISTA
// ============================================================================

export const InterviewStageSchema = z.object({
  id: z.string(),
  goal: z.string(),
  minQuestions: z.number().int().nonnegative(),
  maxQuestions: z.number().int().positive(),
  mustHitTopics: z.array(z.string()),
  sampleQuestions: z.array(z.string()),
  followupStrategies: z.array(z.string()),
  advanceWhen: z.string(),
});

export const InterviewGuardrailsSchema = z.object({
  maxDurationMinutes: z.number().int().positive().max(20), // Máximo 20 min
  maxTotalQuestions: z.number().int().positive().max(30), // Máximo 30 perguntas
  maxFollowupsPerStage: z.number().int().nonnegative(),
  noDuplicateQuestions: z.boolean(),
  minEvidencePerClaim: z.number().int().nonnegative(),
  timeoutPolicy: z.string(),
});

export const JobTuningSchema = z.object({
  senioritySignals: z.array(z.string()),
  leadershipSignals: z.array(z.string()),
  roleSpecificHints: z.array(z.string()),
});

export const InterviewScriptSchema = z.object({
  role: z.string(),
  version: z.string(),
  objectives: z.array(z.string()).min(1),
  guardrails: InterviewGuardrailsSchema,
  stages: z.array(InterviewStageSchema).min(1),
  jobTuning: JobTuningSchema,
});

// ============================================================================
// ESTADO E TURNOS DA ENTREVISTA
// ============================================================================

export const InterviewStateSchema = z.object({
  askedHash: z.string(),
  askedCountTotal: z.number().int().nonnegative(),
  askedCountByStage: z.record(z.string(), z.number().int().nonnegative()),
  mustHitCovered: z.record(z.string(), z.array(z.string())),
  askedHashes: z.array(z.string()),
});

export const InterviewActionSchema = z.enum(["ASK", "FOLLOWUP", "ADVANCE_STAGE", "END"]);

export const InterviewNextSchema = z.object({
  allowed: z.array(InterviewActionSchema),
  rules: z.string(),
});

export const InterviewTurnSchema = z.object({
  type: z.literal("interview_turn"),
  stageId: z.string(),
  action: InterviewActionSchema,
  question: z.string().optional(),
  targetTraits: z.array(z.string()).optional(),
  evidenceHint: z.string().optional(),
  state: InterviewStateSchema,
  next: InterviewNextSchema,
});

// ============================================================================
// ANÁLISE PSICOLÓGICA FINAL
// ============================================================================

export const BigFiveTraitSchema = z.object({
  score: z.number().min(0).max(100),
  description: z.string(),
});

export const BigFiveAnalysisSchema = z.object({
  openness: BigFiveTraitSchema,
  conscientiousness: BigFiveTraitSchema,
  extraversion: BigFiveTraitSchema,
  agreeableness: BigFiveTraitSchema,
  neuroticism: BigFiveTraitSchema,
});

export const DISCAnalysisSchema = z.object({
  dominance: z.number().min(0).max(100),
  influence: z.number().min(0).max(100),
  steadiness: z.number().min(0).max(100),
  compliance: z.number().min(0).max(100),
  profileDescription: z.string(),
});

export const DecisionMakingSchema = z.object({
  thinkingStyle: z.enum(["lógico", "intuitivo", "emocional"]),
  communicationStyle: z.enum(["assertivo", "colaborativo", "reservado", "diplomático"]),
  focus: z.enum(["fatos", "pessoas", "processos"]),
});

export const EmotionalMaturitySchema = z.object({
  score: z.number().min(0).max(100),
  description: z.string(),
});

export const MotivationsSchema = z.object({
  mainDrivers: z.array(z.string()),
  emotionalTriggers: z.array(z.string()),
  emotionalMaturity: EmotionalMaturitySchema,
});

export const RiskFactorSchema = z.object({
  factor: z.string(),
  impact: z.enum(["baixo", "médio", "alto"]),
});

export const LeadershipPotentialSchema = z.object({
  level: z.enum(["baixo", "médio", "alto"]),
  strengths: z.array(z.string()),
  developmentAreas: z.array(z.string()),
});

export const VerdictSchema = z.object({
  recommendation: z.enum([
    "Altamente recomendado",
    "Recomendado com ressalvas",
    "Não recomendado",
  ]),
  justification: z.string(),
});

export const VisualMapSchema = z.object({
  profile: z.string(),
  bigFiveSummary: z.string(),
  discSummary: z.string(),
  motivationsSummary: z.string(),
  riskSummary: z.string(),
});

export const InterviewAnalysisResultSchema = z.object({
  summary: z.string(),
  bigFive: BigFiveAnalysisSchema,
  disc: DISCAnalysisSchema,
  decisionMaking: DecisionMakingSchema,
  motivations: MotivationsSchema,
  risks: z.array(RiskFactorSchema),
  leadershipPotential: LeadershipPotentialSchema,
  verdict: VerdictSchema,
  visualMap: VisualMapSchema,
});

// ============================================================================
// HELPERS E PAYLOADS
// ============================================================================

export const JobForScriptSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.string().nullable().optional(),
  responsibilities: z.string().nullable().optional(),
  skills: z.array(z.string()).optional(),
  workModel: z.string().nullable().optional(),
  tags: z.array(z.object({ tag: z.string() })).optional(),
});

export const CandidateForInterviewSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  resumeJson: z.unknown().optional(),
});

export const StartInterviewPayloadSchema = z.object({
  interviewId: z.string(),
  candidateId: z.string(),
  jobId: z.string(),
  script: InterviewScriptSchema,
  candidate: CandidateForInterviewSchema,
  job: JobForScriptSchema,
});

export const VapiSessionResponseSchema = z.object({
  sessionId: z.string(),
  callUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.string(),
});

export const VapiWebhookEventSchema = z.object({
  type: z.enum(["call.started", "call.ended", "transcript.available", "error"]),
  sessionId: z.string(),
  interviewId: z.string().optional(),
  timestamp: z.string(),
  data: z.unknown().optional(),
});

