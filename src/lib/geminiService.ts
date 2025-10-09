import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
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
    throw new Error(
      `Expected 768 dimensions, got ${embedding.length}`
    );
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
 * Usa IA para análise semântica profunda
 * Retorna score de 0-100
 */
export async function matchCandidateToJob(
  resume: ParsedResume,
  job: {
    title: string;
    description: string;
    requirements?: string | null;
    skills?: string[];
  }
): Promise<{
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `
Você é um especialista em recrutamento e seleção de talentos.

Analise a compatibilidade entre o candidato e a vaga abaixo e retorne um JSON com a seguinte estrutura:

{
  "score": 85,
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "gaps": ["lacuna 1", "lacuna 2"],
  "recommendation": "Recomendação sobre o candidato para esta vaga"
}

⚙️ **Critérios de avaliação**:
- **Score (0-100)**:
  - 90-100: Excelente match, candidato ideal
  - 75-89: Muito bom, candidato qualificado
  - 60-74: Bom, candidato com potencial
  - 40-59: Mediano, algumas lacunas importantes
  - 0-39: Fraco, não recomendado

- Considere:
  - Experiência em posições similares
  - Skills técnicas necessárias vs skills do candidato
  - Nível de senioridade compatível
  - Formação acadêmica relevante
  - Idiomas necessários

- **Strengths**: Liste os 3-5 principais pontos fortes do candidato para esta vaga
- **Gaps**: Liste as principais lacunas ou skills ausentes (máximo 5)
- **Recommendation**: Texto curto (2-3 frases) recomendando ou não o candidato

📋 **VAGA**:
Título: ${job.title}
Descrição: ${job.description?.replace(/<[^>]*>/g, " ").slice(0, 1000)}
${job.requirements ? `Requisitos: ${job.requirements.replace(/<[^>]*>/g, " ").slice(0, 500)}` : ""}
${job.skills && job.skills.length > 0 ? `Skills necessárias: ${job.skills.join(", ")}` : ""}

👤 **CANDIDATO**:
Nome: ${resume.personalInfo?.name || "Não informado"}
Skills: ${resume.skills?.join(", ") || "Nenhuma skill listada"}

Experiências:
${resume.experiences?.map((e) => `- ${e.position} na ${e.company} (${e.startDate || ""} - ${e.endDate || ""}): ${e.description || ""}`).join("\n") || "Nenhuma experiência listada"}

Formação:
${resume.education?.map((e) => `- ${e.degree} em ${e.field || ""} - ${e.institution}`).join("\n") || "Nenhuma formação listada"}

Idiomas: ${resume.languages?.map((l) => `${l.language} (${l.proficiency})`).join(", ") || "Não informado"}

Retorne APENAS o JSON válido, sem comentários.
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

