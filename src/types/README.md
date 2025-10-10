# Tipos TypeScript - Sistema de Entrevista Comportamental

Este diretório contém todos os tipos TypeScript e schemas Zod para o sistema de entrevista comportamental por IA.

## Arquivos

- **`interview.ts`**: Definições de tipos TypeScript
- **`interview.schemas.ts`**: Schemas Zod para validação
- **`interview.index.ts`**: Exports centralizados

## Como Usar

### Importação de Tipos

```typescript
import { InterviewScript, InterviewAnalysisResult } from '@/types/interview.index';

// Usar o tipo
const script: InterviewScript = {
  role: "Entrevistador de RH comportamental",
  version: "1.0",
  // ...
};
```

### Validação com Zod

```typescript
import { InterviewScriptSchema, InterviewAnalysisResultSchema } from '@/types/interview.index';

// Validar dados recebidos
const result = InterviewScriptSchema.safeParse(jsonData);

if (result.success) {
  const validScript = result.data;
  // Use validScript com type safety
} else {
  console.error('Validação falhou:', result.error);
}
```

### Inferir Tipos a partir de Schemas

```typescript
import { z } from 'zod';
import { InterviewScriptSchema } from '@/types/interview.index';

// Infere o tipo do schema
type InterviewScript = z.infer<typeof InterviewScriptSchema>;
```

## Estrutura de Dados

### 1. Roteiro de Entrevista (InterviewScript)

Gerado pela IA após criação da vaga. Salvo em `Job.interviewScriptJson`.

- **Objetivos**: Lista de objetivos da entrevista
- **Guardrails**: Regras de controle (tempo máximo: 15min, máximo de perguntas)
- **Stages**: Estágios da entrevista (intro, execution_style, leadership_collab, culture_values, closure)
- **JobTuning**: Ajustes específicos para a vaga

### 2. Estado da Entrevista (InterviewState)

Mantém controle durante a entrevista ao vivo. Salvo em `Interview.stateJson`.

- **askedCountTotal**: Total de perguntas feitas
- **askedCountByStage**: Perguntas por estágio
- **mustHitCovered**: Tópicos obrigatórios cobertos
- **askedHashes**: Hashes de perguntas (evitar repetição)

### 3. Turno da Entrevista (InterviewTurn)

Envelope JSON de cada interação. Salvo em `Interview.stepsJson` (log resumido).

- **action**: ASK | FOLLOWUP | ADVANCE_STAGE | END
- **question**: Pergunta atual (se aplicável)
- **targetTraits**: Traços sendo avaliados (Big Five, DISC)
- **state**: Estado atualizado
- **next**: Ações permitidas no próximo turno

### 4. Análise Psicológica (InterviewAnalysisResult)

Gerado pela IA após término da entrevista. Salvo em `AssessmentResult.rawJson`.

#### Big Five (OCEAN)
- **Openness**: Abertura a experiências (0-100)
- **Conscientiousness**: Conscienciosidade (0-100)
- **Extraversion**: Extroversão (0-100)
- **Agreeableness**: Amabilidade (0-100)
- **Neuroticism**: Neuroticismo (0-100)

#### DISC
- **Dominance**: Dominância/foco em resultados (0-100)
- **Influence**: Influência/persuasão (0-100)
- **Steadiness**: Estabilidade/cooperação (0-100)
- **Compliance**: Conformidade/análise (0-100)

#### Outros
- **DecisionMaking**: Estilo de tomada de decisão
- **Motivations**: Motivadores principais e gatilhos emocionais
- **Risks**: Fatores de risco identificados
- **LeadershipPotential**: Potencial de liderança
- **Verdict**: Recomendação final

## Exemplos de Uso

### Gerar Roteiro de Entrevista

```typescript
import { generateInterviewScript } from '@/lib/geminiService';
import { InterviewScriptSchema } from '@/types/interview.index';

const job = await db.job.findUnique({ where: { id: jobId } });

// Gerar roteiro
const scriptData = await generateInterviewScript(job);

// Validar antes de salvar
const validation = InterviewScriptSchema.safeParse(scriptData);

if (validation.success) {
  await db.job.update({
    where: { id: jobId },
    data: { interviewScriptJson: validation.data },
  });
}
```

### Processar Turno da Entrevista

```typescript
import { InterviewTurnSchema } from '@/types/interview.index';

// Receber resposta da IA (Vapi)
const turnData = await vapiAgent.processResponse(transcript);

// Validar turno
const turn = InterviewTurnSchema.parse(turnData);

// Verificar ação
if (turn.action === "END") {
  // Finalizar entrevista
  await finalizeInterview(interviewId);
} else if (turn.action === "ADVANCE_STAGE") {
  // Avançar para próximo estágio
  await updateInterviewStage(interviewId, turn.stageId);
}

// Atualizar estado
await db.interview.update({
  where: { id: interviewId },
  data: {
    stateJson: turn.state,
    stepsJson: [...previousSteps, turn],
  },
});
```

### Analisar Entrevista Finalizada

```typescript
import { analyzeInterview } from '@/lib/geminiService';
import { InterviewAnalysisResultSchema } from '@/types/interview.index';

const interview = await db.interview.findUnique({
  where: { id: interviewId },
  include: { job: true, candidate: true },
});

// Analisar transcript
const analysisData = await analyzeInterview(
  interview.transcriptUrl,
  interview.job,
  interview.candidate
);

// Validar análise
const analysis = InterviewAnalysisResultSchema.parse(analysisData);

// Salvar resultado
await db.assessmentResult.create({
  data: {
    tenantId: interview.tenantId,
    candidateId: interview.candidateId,
    model: "BIGFIVE",
    rawJson: analysis,
    normalized: {
      bigFive: analysis.bigFive,
      disc: analysis.disc,
    },
    fitScore: calculateFitScore(analysis),
  },
});
```

## Integração com Vapi

O sistema usa o Vapi para condução das entrevistas ao vivo:

1. **Início**: `approveForInterviewAction` cria `Interview` e inicia sessão Vapi
2. **Durante**: Vapi segue o `InterviewScript` e retorna `InterviewTurn` a cada interação
3. **Fim**: Webhook do Vapi dispara análise do transcript

## Validações Importantes

### Tempo Máximo
O `guardrails.maxDurationMinutes` deve ser 15 minutos.

### Perguntas Máximas
O `guardrails.maxTotalQuestions` deve ser entre 15-20 perguntas.

### Anti-Loop
O sistema mantém `askedHashes` para evitar perguntas repetidas.

### Progressão
Cada estágio tem `mustHitTopics` que precisam ser cobertos antes de avançar.

## Manutenção

Ao adicionar novos campos:

1. Atualizar tipo em `interview.ts`
2. Atualizar schema em `interview.schemas.ts`
3. Exportar em `interview.index.ts`
4. Atualizar este README com exemplos

