import { generateText, embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// Detectar qual provider usar baseado nas variáveis de ambiente
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini"; // "gemini" ou "openai"

// Configurar Gemini
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let google: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let geminiFlash: ReturnType<
  ReturnType<typeof createGoogleGenerativeAI>
> | null = null;
let geminiEmbedding: ReturnType<
  ReturnType<typeof createGoogleGenerativeAI>["textEmbeddingModel"]
> | null = null;

if (AI_PROVIDER === "gemini") {
  if (!geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY ou GOOGLE_API_KEY não está definida nas variáveis de ambiente."
    );
  }
  google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
  geminiFlash = google("gemini-2.0-flash-exp");
  geminiEmbedding = google.textEmbeddingModel("text-embedding-004");
}

// Configurar OpenAI (preparado para uso futuro)
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: ReturnType<typeof createOpenAI> | null = null;
let gpt4: ReturnType<ReturnType<typeof createOpenAI>> | null = null;

if (AI_PROVIDER === "openai") {
  if (!openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY não está definida nas variáveis de ambiente."
    );
  }
  openai = createOpenAI({ apiKey: openaiApiKey });
  gpt4 = openai("gpt-4-turbo"); // ou "gpt-4o" para modelo mais novo
}

// Modelo padrão para geração de texto
const defaultModel = AI_PROVIDER === "openai" ? gpt4! : geminiFlash!;

/**
 * Estrutura esperada do currículo parseado
 */
export interface ParsedResume {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
  };
  summary?: string;
  experiences: Array<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills: string[];
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
}

/**
 * Faz parsing de um currículo em texto usando IA
 * Extrai informações estruturadas do currículo
 */
export async function parseResumeWithAI(
  resumeText: string
): Promise<ParsedResume> {
  const prompt = `
Você é um especialista em análise de currículos e extração de dados estruturados.

Analise o currículo abaixo e extraia as informações em formato JSON válido, seguindo EXATAMENTE esta estrutura:

{
  "personalInfo": {
    "name": "nome completo",
    "email": "email@exemplo.com",
    "phone": "telefone",
    "linkedin": "url do linkedin",
    "location": "cidade, estado, país"
  },
  "summary": "resumo profissional ou objetivo",
  "experiences": [
    {
      "company": "nome da empresa",
      "position": "cargo",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY ou 'Atual'",
      "description": "descrição das atividades",
      "achievements": ["conquista 1", "conquista 2"]
    }
  ],
  "education": [
    {
      "institution": "nome da instituição",
      "degree": "grau (Bacharelado, Mestrado, etc)",
      "field": "área de estudo",
      "startDate": "YYYY",
      "endDate": "YYYY"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "languages": [
    {
      "language": "Português",
      "proficiency": "Nativo/Fluente/Avançado/Intermediário/Básico"
    }
  ],
  "certifications": [
    {
      "name": "nome da certificação",
      "issuer": "emissor",
      "date": "MM/YYYY"
    }
  ]
}

⚙️ **Regras obrigatórias**:
- Retorne APENAS o JSON válido, sem comentários ou explicações
- Se algum campo não estiver presente no currículo, use null ou array vazio []
- Normalize datas para o formato especificado
- Extraia TODAS as skills mencionadas (tecnologias, ferramentas, soft skills)
- Seja preciso e não invente informações que não estão no currículo
- Use português brasileiro para os campos de texto

📄 **Currículo para análise**:
${resumeText}
`;

  const { text } = await generateText({
    model: defaultModel,
    prompt,
  });

  // Limpa possíveis marcadores de código
  const cleaned = text
    .replace(/^```json\s*/, "")
    .replace(/```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned) as ParsedResume;
  return parsed;
}

/**
 * Gera embedding vetorial de um texto usando Gemini
 * Retorna vetor de 768 dimensões para busca semântica
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Para embeddings, sempre usar o modelo apropriado de cada provider
  let embedding: number[];

  if (AI_PROVIDER === "openai") {
    const result = await embed({
      model: openai!.textEmbeddingModel("text-embedding-3-small"),
      value: text,
    });
    embedding = result.embedding;
  } else {
    const result = await embed({
      model: geminiEmbedding!,
      value: text,
    });
    embedding = result.embedding;
  }

  // Garantir que tem 768 dimensões
  if (embedding.length !== 768) {
    throw new Error(`Expected 768 dimensions, got ${embedding.length}`);
  }

  return embedding;
}

/**
 * Prepara texto do currículo para geração de embedding
 * Concatena informações relevantes em um único texto
 */
export function prepareResumeForEmbedding(resume: ParsedResume): string {
  const parts: string[] = [];

  // Informações pessoais
  if (resume.personalInfo?.name) {
    parts.push(`Nome: ${resume.personalInfo.name}`);
  }

  // Resumo profissional
  if (resume.summary) {
    parts.push(`Resumo: ${resume.summary}`);
  }

  // Experiências
  if (resume.experiences?.length > 0) {
    parts.push("Experiências:");
    resume.experiences.forEach((exp) => {
      parts.push(
        `- ${exp.position} na ${exp.company}: ${exp.description || ""}`
      );
    });
  }

  // Formação
  if (resume.education?.length > 0) {
    parts.push("Formação:");
    resume.education.forEach((edu) => {
      parts.push(`- ${edu.degree} em ${edu.field || ""} - ${edu.institution}`);
    });
  }

  // Skills
  if (resume.skills?.length > 0) {
    parts.push(`Skills: ${resume.skills.join(", ")}`);
  }

  // Idiomas
  if (resume.languages && resume.languages.length > 0) {
    const langs = resume.languages
      .map((l) => `${l.language} (${l.proficiency})`)
      .join(", ");
    parts.push(`Idiomas: ${langs}`);
  }

  return parts.join("\n");
}

/**
 * Prepara texto da vaga para geração de embedding
 */
export function prepareJobForEmbedding(job: {
  title: string;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
  skills?: string[];
}): string {
  const parts: string[] = [];

  parts.push(`Título: ${job.title}`);

  if (job.description) {
    // Remove HTML tags
    const cleanDesc = job.description.replace(/<[^>]*>/g, " ").trim();
    parts.push(`Descrição: ${cleanDesc}`);
  }

  if (job.requirements) {
    const cleanReq = job.requirements.replace(/<[^>]*>/g, " ").trim();
    parts.push(`Requisitos: ${cleanReq}`);
  }

  if (job.responsibilities) {
    const cleanResp = job.responsibilities.replace(/<[^>]*>/g, " ").trim();
    parts.push(`Responsabilidades: ${cleanResp}`);
  }

  if (job.skills && job.skills.length > 0) {
    parts.push(`Skills necessárias: ${job.skills.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Calcula score de compatibilidade entre candidato e vaga
 * Usa IA para análise semântica profunda com critérios rigorosos
 * Retorna score de 0-100
 */
export async function matchCandidateToJob(
  resume: ParsedResume,
  job: {
    title: string;
    description: string;
    requirements?: string | null;
    responsibilities?: string | null;
    skills?: string[];
  }
): Promise<{
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}> {
  // Limpar HTML tags
  const cleanDescription =
    job.description
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "";
  const cleanRequirements =
    job.requirements
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "";
  const cleanResponsibilities =
    job.responsibilities
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "";

  const prompt = `
Você é um especialista sênior em recrutamento e seleção de talentos com 15+ anos de experiência.

Analise com RIGOR TÉCNICO a compatibilidade entre o candidato e a vaga. Retorne um JSON com esta estrutura:

{
  "score": 85,
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "gaps": ["lacuna 1", "lacuna 2"],
  "recommendation": "Recomendação fundamentada sobre o candidato"
}

⚙️ **CRITÉRIOS DE AVALIAÇÃO RIGOROSOS**:

📊 **Score (0-100)** - Seja criterioso e realista:
  - 90-100: Match excepcional - candidato ideal com todos requisitos + diferenciais
  - 75-89: Match muito bom - atende requisitos principais + boa experiência
  - 60-74: Match aceitável - atende requisitos básicos, algumas lacunas
  - 40-59: Match fraco - lacunas significativas em requisitos importantes
  - 0-39: Não recomendado - não atende requisitos fundamentais

🎯 **ANÁLISE OBRIGATÓRIA** (peso 60% do score):

1. **NÍVEL DO CARGO** (identifique o nível da vaga):
   - Operacional: execução de tarefas, baixa autonomia
   - Técnico: conhecimento especializado, média autonomia
   - Especialista: expert em área específica, alta autonomia
   - Liderança: gestão de pessoas e processos
   - Estratégico: decisões de alto impacto, C-level
   
   → Candidato tem experiência comprovada neste nível?

2. **SENIORIDADE** (identifique o nível exigido):
   - Júnior: 0-3 anos de experiência
   - Pleno: 3-6 anos de experiência
   - Sênior: 6-10 anos de experiência
   - Especialista/Lead: 10+ anos de experiência
   
   → Anos de experiência do candidato são compatíveis?
   → Se vaga pede "experiência prévia", candidato tem quantos anos?

3. **REQUISITOS TÉCNICOS OBRIGATÓRIOS**:
   → Candidato possui TODAS as skills/tecnologias obrigatórias?
   → Tem anos de experiência suficientes em cada uma?
   → Skills no currículo ≠ experiência profunda

4. **RESPONSABILIDADES DA VAGA**:
   → Candidato já exerceu responsabilidades similares?
   → Tem experiência no escopo de atuação descrito?

📈 **ANÁLISE COMPLEMENTAR** (peso 40% do score):

5. **FORMAÇÃO ACADÊMICA**:
   → Atende requisito de formação (se houver)?
   → Formação é relevante para a área?

6. **PROGRESSÃO DE CARREIRA**:
   → Candidato mostra evolução consistente?
   → Mudanças de cargo fazem sentido?

7. **CERTIFICAÇÕES** (se houver):
   → Possui certificações relevantes para a vaga?

8. **IDIOMAS** (se requisito):
   → Atende nível de proficiência exigido?

9. **EXPERIÊNCIAS RECENTES vs ANTIGAS**:
   → Experiência relevante é recente (últimos 3-5 anos)?
   → Ou é de muito tempo atrás?

⚠️ **REGRAS RÍGIDAS**:
- Se falta requisito OBRIGATÓRIO → score máximo 50
- Se senioridade incompatível → score máximo 60
- Se nível do cargo incompatível → score máximo 65
- Se formação obrigatória ausente → score máximo 55
- Experiência de 1 ano ≠ experiência sólida
- Skill no currículo sem contexto = experiência questionável

📋 **INFORMAÇÕES DA VAGA**:

**Título do Cargo**: ${job.title}

**Descrição Completa**:
${cleanDescription}

**Requisitos Obrigatórios**:
${cleanRequirements || "Não especificado"}

**Responsabilidades do Cargo**:
${cleanResponsibilities || "Não especificado"}

**Skills Necessárias**:
${
  job.skills && job.skills.length > 0
    ? job.skills.join(", ")
    : "Não especificado"
}

👤 **INFORMAÇÕES DO CANDIDATO**:

**Nome**: ${resume.personalInfo?.name || "Não informado"}

**Skills Declaradas**: 
${resume.skills?.join(", ") || "Nenhuma skill listada"}

**Experiências Profissionais**:
${
  resume.experiences
    ?.map((e) => {
      const duration =
        e.startDate && e.endDate ? `(${e.startDate} - ${e.endDate})` : "";
      return `- ${e.position} na ${e.company} ${duration}
  Atividades: ${e.description || "Não informado"}
  Conquistas: ${e.achievements?.join("; ") || "Não informado"}`;
    })
    .join("\n\n") || "Nenhuma experiência listada"
}

**Formação Acadêmica**:
${
  resume.education
    ?.map(
      (e) =>
        `- ${e.degree} em ${e.field || "área não especificada"} - ${
          e.institution
        } (${e.startDate || ""} - ${e.endDate || ""})`
    )
    .join("\n") || "Nenhuma formação listada"
}

**Certificações**:
${
  resume.certifications
    ?.map(
      (c) =>
        `- ${c.name} (${c.issuer || "emissor não informado"}) - ${c.date || ""}`
    )
    .join("\n") || "Nenhuma certificação listada"
}

**Idiomas**: 
${
  resume.languages?.map((l) => `${l.language} - ${l.proficiency}`).join(", ") ||
  "Não informado"
}

**Resumo Profissional**:
${resume.summary || "Não informado"}

🎯 **INSTRUÇÕES FINAIS**:
- Seja CRITERIOSO e REALISTA no score
- Em **strengths**: liste 3-5 pontos fortes CONCRETOS (não genéricos)
- Em **gaps**: liste lacunas ESPECÍFICAS (skills ausentes, falta de experiência em X, etc)
- Em **recommendation**: seja direto - recomenda ou não? Por quê?
- Retorne APENAS o JSON válido, sem comentários ou explicações adicionais

`;

  const { text } = await generateText({
    model: defaultModel,
    prompt,
  });

  const cleaned = text
    .replace(/^```json\s*/, "")
    .replace(/```$/, "")
    .trim();

  const analysis = JSON.parse(cleaned);
  return analysis;
}

/**
 * Calcula similaridade de cosseno entre dois vetores
 * Usado para comparar embeddings
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================================================
// SISTEMA DE ENTREVISTA COMPORTAMENTAL
// ============================================================================

/**
 * Gera roteiro de entrevista comportamental personalizado baseado na vaga
 * O roteiro é um guia direcionador, não engessado - a IA adapta em tempo real
 *
 * @param job - Dados da vaga para contexto
 * @returns Roteiro completo da entrevista em JSON
 */
export async function generateInterviewScript(job: {
  title: string;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
  skills?: string[];
  workModel?: string | null;
  tags?: Array<{ tag: string }>;
}): Promise<unknown> {
  // Limpar HTML tags
  const cleanDescription =
    job.description
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "";
  const cleanRequirements =
    job.requirements
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "";
  const cleanResponsibilities =
    job.responsibilities
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "";

  const prompt = `
Você é um psicólogo organizacional sênior especializado em entrevistas comportamentais para seleção de talentos.

Gere um roteiro de entrevista comportamental personalizado para a vaga abaixo. O roteiro é um DIRECIONADOR, não engessado - a IA entrevistadora vai adaptar perguntas em tempo real baseado nas respostas.

Retorne um JSON válido com esta estrutura EXATA:

{
  "role": "Entrevistador de RH comportamental",
  "version": "1.0",
  "objectives": [
    "objetivo 1",
    "objetivo 2",
    "objetivo 3"
  ],
  "guardrails": {
    "maxDurationMinutes": 15,
    "maxTotalQuestions": 18,
    "maxFollowupsPerStage": 2,
    "noDuplicateQuestions": true,
    "minEvidencePerClaim": 1,
    "timeoutPolicy": "se candidato não responder, reformule 1x e avance"
  },
  "stages": [
    {
      "id": "intro",
      "goal": "Rapport e contexto inicial",
      "minQuestions": 2,
      "maxQuestions": 3,
      "mustHitTopics": ["motivação para a vaga", "momento profissional"],
      "sampleQuestions": [
        "Conte brevemente seu momento profissional atual.",
        "O que te motivou a se candidatar a esta vaga?"
      ],
      "followupStrategies": [
        "Peça exemplo concreto dos últimos 12 meses.",
        "Pergunte impacto e resultado mensurável."
      ],
      "advanceWhen": "mustHitTopics cobertos OU maxQuestions atingido"
    },
    {
      "id": "execution_style",
      "goal": "Como planeja, prioriza, comunica e entrega",
      "minQuestions": 3,
      "maxQuestions": 5,
      "mustHitTopics": ["priorização", "comunicação", "resolução de problemas"],
      "sampleQuestions": [
        "Como você prioriza quando tudo parece urgente?",
        "Descreva um problema ambíguo que você resolveu."
      ],
      "followupStrategies": [
        "Evidência: ações, métricas, stakeholders.",
        "Pergunte trade-offs e aprendizados."
      ],
      "advanceWhen": "mustHitTopics cobertos OU maxQuestions atingido"
    },
    {
      "id": "leadership_collab",
      "goal": "Liderança, influência, feedback e conflito",
      "minQuestions": 2,
      "maxQuestions": 4,
      "mustHitTopics": ["conflito", "feedback", "colaboração"],
      "sampleQuestions": [
        "Conte um conflito de equipe e sua atuação.",
        "Como dá feedback difícil mantendo a relação?"
      ],
      "followupStrategies": [
        "Busque contexto, ação, resultado (CAR).",
        "Cheque autoconsciência e accountability."
      ],
      "advanceWhen": "mustHitTopics cobertos OU maxQuestions atingido"
    },
    {
      "id": "culture_values",
      "goal": "Valores, motivadores e fit cultural",
      "minQuestions": 2,
      "maxQuestions": 3,
      "mustHitTopics": ["valores centrais", "condições para alta performance"],
      "sampleQuestions": [
        "Quais valores são inegociáveis no trabalho?",
        "Em que condições você performa no seu melhor?"
      ],
      "followupStrategies": [
        "Conecte com valores da vaga.",
        "Cheque consistência com histórico citado."
      ],
      "advanceWhen": "mustHitTopics cobertos OU maxQuestions atingido"
    },
    {
      "id": "closure",
      "goal": "Fechamento e confirmação",
      "minQuestions": 1,
      "maxQuestions": 2,
      "mustHitTopics": ["pontos fortes", "áreas de desenvolvimento"],
      "sampleQuestions": [
        "Seus 2 maiores pontos fortes e 1 área a evoluir?",
        "Algo relevante que não perguntamos?"
      ],
      "followupStrategies": [],
      "advanceWhen": "maxQuestions atingido"
    }
  ],
  "jobTuning": {
    "senioritySignals": ["autonomia", "impacto sistêmico", "mentoria"],
    "leadershipSignals": ["delegação", "gestão de conflito", "decisão sob pressão"],
    "roleSpecificHints": [
      "Se vaga exigir liderança: priorize 'leadership_collab'.",
      "Se vaga for IC sênior: aprofunde 'execution_style'."
    ]
  }
}

⚙️ **REGRAS IMPORTANTES**:

1. **Duração**: Entrevista deve durar MÁXIMO 15 minutos
2. **Perguntas**: Entre 15-20 perguntas no total
3. **Estágios**: Crie 4-5 estágios cobrindo: intro, execução, liderança/colaboração, valores/cultura, closure
4. **Perguntas Amostra**: Devem ser abertas, situacionais, buscando exemplos concretos
5. **Follow-up**: Estratégias para aprofundar respostas vagas
6. **Sinais de Senioridade**: Baseie nos requisitos da vaga

📋 **INFORMAÇÕES DA VAGA**:

**Título**: ${job.title}

**Descrição**:
${cleanDescription}

**Requisitos**:
${cleanRequirements || "Não especificado"}

**Responsabilidades**:
${cleanResponsibilities || "Não especificado"}

**Skills**:
${
  job.skills && job.skills.length > 0
    ? job.skills.join(", ")
    : "Não especificado"
}

**Modelo de Trabalho**:
${job.workModel || "Não especificado"}

**Tags**:
${
  job.tags && job.tags.length > 0
    ? job.tags.map((t) => t.tag).join(", ")
    : "Não especificado"
}

🎯 **INSTRUÇÕES FINAIS**:
- Personalize os estágios baseado no nível da vaga (júnior, pleno, sênior, líder)
- Se a vaga exige liderança, aprofunde o estágio "leadership_collab"
- Se a vaga é técnica individual contributor, foque em "execution_style"
- Perguntas devem buscar exemplos SITUACIONAIS (método STAR/CAR)
- Retorne APENAS o JSON válido, sem comentários ou explicações
`;

  const { text } = await generateText({
    model: defaultModel,
    prompt,
  });

  const cleaned = text
    .replace(/^```json\s*/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Analisa o transcript de uma entrevista comportamental
 * Gera análise psicológica completa: Big Five, DISC, motivações, riscos, etc
 *
 * @param transcript - Texto do transcript da entrevista
 * @param job - Dados da vaga para contexto
 * @param candidate - Dados básicos do candidato
 * @returns Análise completa em JSON
 */
export async function analyzeInterview(
  transcript: string,
  job: {
    title: string;
    description: string;
    requirements?: string | null;
  },
  candidate: {
    name?: string | null;
    email?: string | null;
  }
): Promise<unknown> {
  const prompt = `
Você é um psicólogo organizacional sênior, especialista em avaliação de candidatos para empresas de tecnologia.

Analise o transcript da entrevista comportamental abaixo e produza um laudo técnico objetivo e estruturado.

Retorne um JSON válido com esta estrutura EXATA:

{
  "summary": "Resumo executivo de 3-4 linhas sobre o perfil do candidato",
  "bigFive": {
    "openness": {
      "score": 75,
      "description": "Descrição breve do traço observado"
    },
    "conscientiousness": {
      "score": 82,
      "description": "Descrição breve do traço observado"
    },
    "extraversion": {
      "score": 45,
      "description": "Descrição breve do traço observado"
    },
    "agreeableness": {
      "score": 90,
      "description": "Descrição breve do traço observado"
    },
    "neuroticism": {
      "score": 30,
      "description": "Descrição breve do traço observado"
    }
  },
  "disc": {
    "dominance": 60,
    "influence": 70,
    "steadiness": 80,
    "compliance": 50,
    "profileDescription": "Perfil DISC identificado (ex: IS - Influente-Estável)"
  },
  "decisionMaking": {
    "thinkingStyle": "lógico",
    "communicationStyle": "colaborativo",
    "focus": "pessoas"
  },
  "motivations": {
    "mainDrivers": [
      "Aprendizado contínuo",
      "Impacto no negócio",
      "Autonomia"
    ],
    "emotionalTriggers": [
      "Microgerenciamento",
      "Falta de clareza"
    ],
    "emotionalMaturity": {
      "score": 85,
      "description": "Alta maturidade emocional, demonstra autoconhecimento"
    }
  },
  "risks": [
    {
      "factor": "Perfeccionismo excessivo pode atrasar entregas",
      "impact": "médio"
    }
  ],
  "leadershipPotential": {
    "level": "alto",
    "strengths": [
      "Empatia natural",
      "Comunicação clara",
      "Capacidade de influenciar"
    ],
    "developmentAreas": [
      "Delegar mais",
      "Tomar decisões difíceis"
    ]
  },
  "verdict": {
    "recommendation": "Altamente recomendado",
    "justification": "Candidato demonstra fit cultural forte, habilidades técnicas sólidas e potencial de crescimento. Pontos de atenção são gerenciáveis com mentoria."
  },
  "visualMap": {
    "profile": "Colaborador-Influenciador",
    "bigFiveSummary": "O(75) C(82) E(45) A(90) N(30)",
    "discSummary": "D(60) I(70) S(80) C(50)",
    "motivationsSummary": "Movido por aprendizado e impacto; valoriza autonomia",
    "riskSummary": "Perfeccionismo moderado; baixo risco geral"
  }
}

⚙️ **CRITÉRIOS DE AVALIAÇÃO**:

**Big Five (0-100 cada)**:
- **Openness**: Abertura a experiências, criatividade, curiosidade intelectual
- **Conscientiousness**: Organização, disciplina, foco em metas
- **Extraversion**: Energia social, assertividade, busca por estímulos
- **Agreeableness**: Empatia, cooperação, confiança nos outros
- **Neuroticism**: Estabilidade emocional (score baixo = mais estável)

**DISC (0-100 cada)**:
- **Dominance**: Foco em resultados, decisão rápida, competitividade
- **Influence**: Persuasão, otimismo, sociabilidade
- **Steadiness**: Paciência, lealdade, cooperação, ritmo constante
- **Compliance**: Precisão, análise, seguir regras e processos

**Decision Making**:
- thinkingStyle: "lógico" | "intuitivo" | "emocional"
- communicationStyle: "assertivo" | "colaborativo" | "reservado" | "diplomático"
- focus: "fatos" | "pessoas" | "processos"

**Motivations**:
- mainDrivers: 2-4 principais motivadores
- emotionalTriggers: 1-3 gatilhos que podem afetar performance
- emotionalMaturity: score 0-100 + descrição

**Risks**:
- Lista de 0-3 fatores de risco
- impact: "baixo" | "médio" | "alto"

**Leadership Potential**:
- level: "baixo" | "médio" | "alto"
- strengths: 2-4 pontos fortes
- developmentAreas: 1-3 áreas a desenvolver

**Verdict**:
- recommendation: "Altamente recomendado" | "Recomendado com ressalvas" | "Não recomendado"
- justification: 2-3 linhas com fundamentação

📋 **CONTEXTO DA VAGA**:

**Título**: ${job.title}
**Descrição**: ${job.description?.replace(/<[^>]*>/g, " ").trim() || ""}
**Requisitos**: ${
    job.requirements?.replace(/<[^>]*>/g, " ").trim() || "Não especificado"
  }

👤 **CANDIDATO**: ${candidate.name || "Nome não informado"}

📄 **TRANSCRIPT DA ENTREVISTA**:

${transcript}

🎯 **INSTRUÇÕES FINAIS**:
- Seja OBJETIVO e baseie-se em EVIDÊNCIAS do transcript
- Não invente informações - se algo não ficou claro, indique nos riscos
- Scores devem refletir o que foi OBSERVADO na entrevista
- No verdict, seja direto: recomenda ou não? Por quê?
- Retorne APENAS o JSON válido, sem comentários ou explicações
`;

  const { text } = await generateText({
    model: defaultModel,
    prompt,
  });

  const cleaned = text
    .replace(/^```json\s*/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned);
}
