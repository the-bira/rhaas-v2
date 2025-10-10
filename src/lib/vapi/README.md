# Integração Vapi - Entrevistas Comportamentais por Voz

Este módulo integra o sistema de entrevistas comportamentais com a plataforma Vapi para condução de entrevistas por voz (telefone ou web).

## Arquivos

- **`interviewAgent.ts`**: Configuração do agente entrevistador
- **`startInterview.ts`**: Funções para iniciar/gerenciar sessões
- **`vapi.sdk.ts`**: SDK básico do Vapi (web)
- **Webhook**: `src/app/api/vapi/webhook/route.ts`

## Como Funciona

### 1. Criação da Vaga
```
Vaga criada → Roteiro gerado (Inngest) → Salvo em Job.interviewScriptJson
```

### 2. Aprovação do Candidato
```
Recrutador aprova → approveForInterviewAction cria Interview
```

### 3. Início da Entrevista

**Opção A: Chamada Telefônica**
```typescript
import { startInterviewSession } from '@/lib/vapi/startInterview';

const session = await startInterviewSession({
  interviewId: interview.id,
  script: job.interviewScriptJson,
  candidateName: candidate.name,
  phoneNumber: '+5511999999999'
});

// Salvar session.id em Interview.vapiSessionId
```

**Opção B: Link Web (Candidato inicia)**
```typescript
import { createWebCallLink } from '@/lib/vapi/startInterview';

const { callId, webUrl } = await createWebCallLink({
  interviewId: interview.id,
  script: job.interviewScriptJson,
  candidateName: candidate.name,
});

// Enviar webUrl para o candidato por email
// Salvar callId em Interview.vapiSessionId
```

### 4. Durante a Entrevista

O agente Vapi:
- Segue o roteiro como guia
- Adapta perguntas baseado nas respostas
- Controla tempo (máx 15 minutos)
- Faz follow-ups quando necessário
- Busca exemplos concretos (método STAR/CAR)

### 5. Fim da Entrevista

```
Entrevista termina → Webhook /api/vapi/webhook
                   ↓
            Dispara evento: interview/analyze.requested
                   ↓
            analyzeInterviewFunction (Inngest)
                   ↓
            Análise Big Five, DISC, etc
                   ↓
            Salva em AssessmentResult + FinalScore
```

## Configuração

### Variáveis de Ambiente

Adicione no `.env`:

```bash
# API Key do Vapi (obrigatória)
VAPI_API_KEY=vapi_xxx

# Token web do Vapi (opcional, para web SDK)
NEXT_PUBLIC_VAPI_WEB_TOKEN=xxx

# Número de telefone do Vapi (opcional, para chamadas telefônicas)
VAPI_PHONE_NUMBER_ID=xxx

# Secret para validar webhooks (recomendado)
VAPI_WEBHOOK_SECRET=xxx
```

### Configurar Webhook no Vapi

1. Acesse https://dashboard.vapi.ai
2. Vá em Settings → Webhooks
3. Adicione URL: `https://seu-dominio.vercel.app/api/vapi/webhook`
4. Eventos: `call.started`, `call.ended`, `transcript.available`, `error`
5. Copie o secret e adicione em `VAPI_WEBHOOK_SECRET`

## Configuração do Agente

### Modelo de IA

O agente usa **GPT-4o** da OpenAI por padrão:

```typescript
model: {
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.7
}
```

Para trocar:
- `gpt-4-turbo`: Mais barato, menos rápido
- `gpt-3.5-turbo`: Mais barato ainda, qualidade menor

### Voz

Por padrão usa **11labs** (voz Rachel):

```typescript
voice: {
  provider: "11labs",
  voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel
}
```

Alternativas:
- `pNInz6obpgDQGcFmaJgB` - Adam (masculina)
- `EXAVITQu4vr4xnSDxMaL` - Sarah (feminina jovem)

Outros providers:
- `azure` - Azure TTS
- `playht` - Play.ht
- `rime` - Rime AI

### Duração Máxima

Configurada automaticamente baseado no roteiro:

```typescript
maxDurationSeconds: script.guardrails.maxDurationMinutes * 60 // 15 min = 900s
```

## System Prompt

O agente recebe um prompt detalhado que inclui:

- Objetivos da entrevista
- Guardrails (tempo, quantidade de perguntas)
- Estágios da entrevista (intro, execução, liderança, valores, closure)
- Técnicas de entrevista (STAR/CAR)
- Sinais de senioridade/liderança a observar
- Tom e estilo de condução

O prompt é gerado dinamicamente pela função `getInterviewerSystemPrompt()`.

## API do Vapi

### Criar Chamada Telefônica

```bash
POST https://api.vapi.ai/call
Authorization: Bearer {VAPI_API_KEY}

{
  "assistant": {...},
  "phoneNumber": "+5511999999999",
  "phoneNumberId": "xxx"
}
```

### Criar Link Web

```bash
POST https://api.vapi.ai/call/web
Authorization: Bearer {VAPI_API_KEY}

{
  "assistant": {...}
}
```

### Buscar Status

```bash
GET https://api.vapi.ai/call/{callId}
Authorization: Bearer {VAPI_API_KEY}
```

### Encerrar Chamada

```bash
DELETE https://api.vapi.ai/call/{callId}
Authorization: Bearer {VAPI_API_KEY}
```

## Webhook Payload

### call.started
```json
{
  "type": "call.started",
  "call": {
    "id": "xxx",
    "status": "in-progress"
  },
  "timestamp": "2025-01-01T10:00:00Z"
}
```

### call.ended
```json
{
  "type": "call.ended",
  "call": {
    "id": "xxx",
    "status": "ended",
    "transcript": "Entrevistador: Olá...",
    "recordingUrl": "https://...",
    "duration": 876,
    "endedReason": "assistant-ended-call"
  },
  "timestamp": "2025-01-01T10:15:00Z"
}
```

### transcript.available
```json
{
  "type": "transcript.available",
  "call": {
    "id": "xxx",
    "transcript": [
      {
        "role": "assistant",
        "content": "Olá! Obrigado por participar...",
        "timestamp": "2025-01-01T10:00:05Z"
      },
      {
        "role": "user",
        "content": "Olá, obrigado!",
        "timestamp": "2025-01-01T10:00:10Z"
      }
    ]
  },
  "timestamp": "2025-01-01T10:15:05Z"
}
```

## Fluxo Completo (Exemplo)

```typescript
// 1. Candidato é aprovado para entrevista
const interview = await db.interview.create({
  data: {
    tenantId: job.tenantId,
    jobId: job.id,
    candidateId: candidate.id,
    kind: "BEHAVIORAL",
    status: "scheduled",
  },
});

// 2. Buscar roteiro da vaga
const script = job.interviewScriptJson as InterviewScript;

// 3. Iniciar sessão Vapi
const session = await startInterviewSession({
  interviewId: interview.id,
  script,
  candidateName: candidate.name || "Candidato",
  phoneNumber: candidate.phoneNumber, // Opcional
});

// 4. Salvar session ID
await db.interview.update({
  where: { id: interview.id },
  data: {
    vapiSessionId: session.id,
    status: "in_progress",
  },
});

// 5. Entrevista acontece (15 min)
// ...

// 6. Webhook recebe call.ended
// → Dispara análise via Inngest

// 7. Análise completa
// → AssessmentResult criado
// → FinalScore atualizado
// → Interview.status = "completed"
```

## Troubleshooting

### Chamada não inicia

1. Verificar `VAPI_API_KEY` configurada
2. Verificar número de telefone válido (formato E.164: +5511999999999)
3. Verificar `VAPI_PHONE_NUMBER_ID` se usar telefone
4. Ver logs no dashboard Vapi

### Webhook não dispara análise

1. Verificar URL do webhook configurada no Vapi
2. Verificar `Interview.vapiSessionId` está salvo corretamente
3. Ver logs do webhook: `GET /api/vapi/webhook`
4. Verificar Inngest está rodando

### Análise não gera resultado

1. Verificar transcript foi recebido (ver logs)
2. Verificar `GEMINI_API_KEY` ou `OPENAI_API_KEY`
3. Ver logs da função `analyzeInterviewFunction` no Inngest
4. Validar se transcript tem conteúdo suficiente

### Qualidade da entrevista baixa

1. Revisar system prompt em `getInterviewerSystemPrompt()`
2. Ajustar temperatura do modelo (0.5-0.9)
3. Testar vozes diferentes
4. Melhorar roteiro gerado (`generateInterviewScript`)

## Custos Estimados

### Vapi
- **Chamada telefônica**: ~$0.08/minuto
- **Chamada web**: ~$0.05/minuto
- **Recording + Transcription**: Incluído

### OpenAI (GPT-4o)
- **Entrevista 15 min (~3000 tokens)**: ~$0.03

### 11labs (Voice)
- **15 minutos de voz**: ~$0.20

**Total por entrevista**: ~$1.00 - $1.50

## Próximos Passos

- [ ] Implementar validação de assinatura do webhook
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Criar UI para visualizar entrevistas em tempo real
- [ ] Implementar análise de sentimento em tempo real
- [ ] Adicionar métricas de qualidade de voz/conexão
- [ ] Suporte a gravação de vídeo (quando disponível no Vapi)

## Links Úteis

- [Documentação Vapi](https://docs.vapi.ai)
- [Dashboard Vapi](https://dashboard.vapi.ai)
- [Vozes 11labs](https://elevenlabs.io/voice-library)
- [Modelos OpenAI](https://platform.openai.com/docs/models)

