/**
 * Tipos TypeScript para Sistema de Entrevista Comportamental por IA
 * 
 * Este arquivo define as estruturas de dados usadas no sistema de entrevistas:
 * - Roteiro de entrevista (gerado pela IA baseado na vaga)
 * - Estado e turnos da entrevista (controle de fluxo)
 * - Análise psicológica final (Big Five, DISC, etc)
 */

// ============================================================================
// ROTEIRO DE ENTREVISTA (Gerado pela IA e salvo em Job.interviewScriptJson)
// ============================================================================

/**
 * Estágio do roteiro de entrevista
 * Cada estágio tem um objetivo específico e tópicos a cobrir
 */
export interface InterviewStage {
  id: string;
  goal: string;
  minQuestions: number;
  maxQuestions: number;
  mustHitTopics: string[];
  sampleQuestions: string[];
  followupStrategies: string[];
  advanceWhen: string;
}

/**
 * Regras de controle (guardrails) da entrevista
 * Garantem que a entrevista não fuja do esperado
 */
export interface InterviewGuardrails {
  maxDurationMinutes: number; // 15 minutos máximo
  maxTotalQuestions: number; // 15-20 perguntas no total
  maxFollowupsPerStage: number; // Máximo de follow-ups por estágio
  noDuplicateQuestions: boolean; // Não repetir perguntas
  minEvidencePerClaim: number; // Mínimo de evidências por afirmação
  timeoutPolicy: string; // O que fazer se candidato não responder
}

/**
 * Ajustes do roteiro baseado na vaga
 * Sinais que a IA deve buscar baseado no nível da vaga
 */
export interface JobTuning {
  senioritySignals: string[];
  leadershipSignals: string[];
  roleSpecificHints: string[];
}

/**
 * Roteiro completo de entrevista comportamental
 * Gerado pela IA após criação da vaga
 */
export interface InterviewScript {
  role: string;
  version: string;
  objectives: string[];
  guardrails: InterviewGuardrails;
  stages: InterviewStage[];
  jobTuning: JobTuning;
}

// ============================================================================
// ESTADO E TURNOS DA ENTREVISTA (Controle durante a entrevista ao vivo)
// ============================================================================

/**
 * Estado atual da entrevista
 * Mantém contadores e controle de progressão
 */
export interface InterviewState {
  askedHash: string; // Hash da última pergunta feita
  askedCountTotal: number; // Total de perguntas feitas
  askedCountByStage: Record<string, number>; // Perguntas por estágio
  mustHitCovered: Record<string, string[]>; // Tópicos obrigatórios cobertos por estágio
  askedHashes: string[]; // Todas as hashes de perguntas (evitar repetição)
}

/**
 * Ações permitidas no próximo turno
 */
export type InterviewAction = "ASK" | "FOLLOWUP" | "ADVANCE_STAGE" | "END";

/**
 * Próximos passos permitidos
 */
export interface InterviewNext {
  allowed: InterviewAction[];
  rules: string;
}

/**
 * Envelope JSON de cada turno da entrevista
 * Toda interação do agente segue este formato
 */
export interface InterviewTurn {
  type: "interview_turn";
  stageId: string;
  action: InterviewAction;
  question?: string;
  targetTraits?: string[]; // Big Five, DISC, competências
  evidenceHint?: string; // Dica do que o candidato deve provar
  state: InterviewState;
  next: InterviewNext;
}

// ============================================================================
// ANÁLISE PSICOLÓGICA FINAL (Gerado após término da entrevista)
// ============================================================================

/**
 * Score e descrição de um traço Big Five
 */
export interface BigFiveTrait {
  score: number; // 0-100
  description: string;
}

/**
 * Modelo Big Five (OCEAN)
 * Os 5 grandes traços de personalidade
 */
export interface BigFiveAnalysis {
  openness: BigFiveTrait; // Abertura a experiências
  conscientiousness: BigFiveTrait; // Conscienciosidade
  extraversion: BigFiveTrait; // Extroversão
  agreeableness: BigFiveTrait; // Amabilidade
  neuroticism: BigFiveTrait; // Neuroticismo
}

/**
 * Modelo DISC
 * Avalia comportamento e estilo de trabalho
 */
export interface DISCAnalysis {
  dominance: number; // 0-100: Dominância (foco em resultados)
  influence: number; // 0-100: Influência (persuasão, otimismo)
  steadiness: number; // 0-100: Estabilidade (paciência, cooperação)
  compliance: number; // 0-100: Conformidade (precisão, análise)
  profileDescription: string;
}

/**
 * Estilo de tomada de decisão
 */
export interface DecisionMaking {
  thinkingStyle: "lógico" | "intuitivo" | "emocional";
  communicationStyle: "assertivo" | "colaborativo" | "reservado" | "diplomático";
  focus: "fatos" | "pessoas" | "processos";
}

/**
 * Maturidade emocional do candidato
 */
export interface EmotionalMaturity {
  score: number; // 0-100
  description: string;
}

/**
 * Motivações e drivers do candidato
 */
export interface Motivations {
  mainDrivers: string[]; // Principais motivadores
  emotionalTriggers: string[]; // Gatilhos emocionais
  emotionalMaturity: EmotionalMaturity;
}

/**
 * Fator de risco identificado
 */
export interface RiskFactor {
  factor: string;
  impact: "baixo" | "médio" | "alto";
}

/**
 * Potencial de liderança
 */
export interface LeadershipPotential {
  level: "baixo" | "médio" | "alto";
  strengths: string[];
  developmentAreas: string[];
}

/**
 * Veredicto final da análise
 */
export interface Verdict {
  recommendation: "Altamente recomendado" | "Recomendado com ressalvas" | "Não recomendado";
  justification: string;
}

/**
 * Mapa visual resumido (para dashboards)
 */
export interface VisualMap {
  profile: string;
  bigFiveSummary: string; // Ex: "O(75) C(82) E(45) A(90) N(30)"
  discSummary: string; // Ex: "D(60) I(70) S(80) C(50)"
  motivationsSummary: string;
  riskSummary: string;
}

/**
 * Análise completa da entrevista comportamental
 * Gerado pela IA após processar o transcript
 * Salvo em AssessmentResult.rawJson
 */
export interface InterviewAnalysisResult {
  summary: string; // Resumo executivo
  bigFive: BigFiveAnalysis;
  disc: DISCAnalysis;
  decisionMaking: DecisionMaking;
  motivations: Motivations;
  risks: RiskFactor[];
  leadershipPotential: LeadershipPotential;
  verdict: Verdict;
  visualMap: VisualMap;
}

// ============================================================================
// HELPERS E VALIDAÇÕES
// ============================================================================

/**
 * Dados da vaga para geração do roteiro
 */
export interface JobForScript {
  title: string;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
  skills?: string[];
  workModel?: string | null;
  tags?: Array<{ tag: string }>;
}

/**
 * Dados do candidato para contexto da entrevista
 */
export interface CandidateForInterview {
  id: string;
  name?: string | null;
  email?: string | null;
  resumeJson?: unknown;
}

/**
 * Payload para iniciar uma sessão de entrevista Vapi
 */
export interface StartInterviewPayload {
  interviewId: string;
  candidateId: string;
  jobId: string;
  script: InterviewScript;
  candidate: CandidateForInterview;
  job: JobForScript;
}

/**
 * Resposta do Vapi ao iniciar sessão
 */
export interface VapiSessionResponse {
  sessionId: string;
  callUrl?: string;
  phoneNumber?: string;
  status: string;
}

/**
 * Evento do webhook Vapi
 */
export interface VapiWebhookEvent {
  type: "call.started" | "call.ended" | "transcript.available" | "error";
  sessionId: string;
  interviewId?: string;
  timestamp: string;
  data?: unknown;
}

