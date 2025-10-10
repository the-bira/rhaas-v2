import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY ou GOOGLE_API_KEY não está definida nas variáveis de ambiente."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

  const result = await model.generateContent(prompt);
  const text = result.response.text();

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
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const result = await model.embedContent(text);
  const embedding = result.embedding.values;

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

  const result = await model.generateContent(prompt);
  const text = result.response.text();

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

