/**
 * Exports centralizados para tipos e schemas de entrevista
 * 
 * Use: import { InterviewScript, InterviewScriptSchema } from '@/types/interview.index'
 */

// Tipos
export type {
  // Roteiro
  InterviewScript,
  InterviewStage,
  InterviewGuardrails,
  JobTuning,
  
  // Estado e Turnos
  InterviewState,
  InterviewAction,
  InterviewNext,
  InterviewTurn,
  
  // Análise Psicológica
  BigFiveTrait,
  BigFiveAnalysis,
  DISCAnalysis,
  DecisionMaking,
  EmotionalMaturity,
  Motivations,
  RiskFactor,
  LeadershipPotential,
  Verdict,
  VisualMap,
  InterviewAnalysisResult,
  
  // Helpers
  JobForScript,
  CandidateForInterview,
  StartInterviewPayload,
  VapiSessionResponse,
  VapiWebhookEvent,
} from "./interview";

// Schemas Zod
export {
  // Roteiro
  InterviewScriptSchema,
  InterviewStageSchema,
  InterviewGuardrailsSchema,
  JobTuningSchema,
  
  // Estado e Turnos
  InterviewStateSchema,
  InterviewActionSchema,
  InterviewNextSchema,
  InterviewTurnSchema,
  
  // Análise Psicológica
  BigFiveTraitSchema,
  BigFiveAnalysisSchema,
  DISCAnalysisSchema,
  DecisionMakingSchema,
  EmotionalMaturitySchema,
  MotivationsSchema,
  RiskFactorSchema,
  LeadershipPotentialSchema,
  VerdictSchema,
  VisualMapSchema,
  InterviewAnalysisResultSchema,
  
  // Helpers
  JobForScriptSchema,
  CandidateForInterviewSchema,
  StartInterviewPayloadSchema,
  VapiSessionResponseSchema,
  VapiWebhookEventSchema,
} from "./interview.schemas";

