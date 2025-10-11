"use client";

import { useState } from "react";
import { Agent } from "./Agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { startInterviewSessionAction } from "@/actions/candidate/startInterviewSessionAction";
import { vapi } from "@/lib/vapi/vapi.sdk";

// Debug: verificar se vapi está disponível
console.log("🔧 Vapi SDK importado:", !!vapi);

interface InterviewRoomProps {
  accessToken: string;
  jobTitle: string;
  candidateName: string;
  initialStatus: string;
  initialSessionId: string | null;
  jobData?: {
    description?: string | null;
    requirements?: string | null;
    tags?: string[];
    interviewScriptJson?: unknown;
  };
  candidateData?: {
    email?: string | null;
  };
}

export function InterviewRoom({
  accessToken,
  jobTitle,
  candidateName,
  initialStatus,
  initialSessionId,
  jobData,
  candidateData,
}: InterviewRoomProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [, setSessionId] = useState<string | null>(initialSessionId);
  const [isStarting, setIsStarting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callActive, setCallActive] = useState(false);

  // Debug: log dos dados recebidos
  console.log("🎯 InterviewRoom props:", {
    accessToken: accessToken ? "✅ Presente" : "❌ Ausente",
    jobTitle,
    candidateName,
    initialStatus,
    initialSessionId: initialSessionId ? "✅ Presente" : "❌ Ausente",
  });

  // Não reconectar automaticamente - usuário deve clicar "Start Interview"
  // useEffect(() => {
  //   if (sessionId && initialStatus === "in_progress" && sessionId !== "null") {
  //     console.log("🔄 Reconectando à sessão existente:", sessionId);
  //     connectToVapi(sessionId);
  //   }
  // }, [sessionId, initialStatus]);

  async function handleStartInterview() {
    setIsStarting(true);

    try {
      const result = await startInterviewSessionAction(accessToken);

      if (!result.success) {
        toast.error(result.error);
        setIsStarting(false);
        return;
      }

      setSessionId(result.sessionId);
      setStatus("in_progress");
      toast.success(result.message);

      // Conectar ao Vapi
      await connectToVapi(result.sessionId);
    } catch (error) {
      console.error("Erro ao iniciar entrevista:", error);
      toast.error("Erro ao iniciar entrevista. Tente novamente.");
      setIsStarting(false);
    }
  }

  async function connectToVapi(sessionId: string) {
    try {
      console.log("🔗 Conectando ao Vapi com sessionId:", sessionId);
      console.log(
        "🔑 Vapi token disponível:",
        !!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN
      );
      console.log("🔧 Vapi instance:", !!vapi);
      console.log(
        "🔧 Vapi assistantId:",
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
      );

      // Verificar se vapi está disponível
      if (!vapi) {
        throw new Error("Vapi SDK não foi inicializado corretamente");
      }

      // Log para debug
      console.log("🎯 Iniciando entrevista com:", {
        candidateName,
        jobTitle,
        sessionId,
      });

      // Diagnóstico
      console.log(
        "🧠 Tipo do sessionId:",
        typeof sessionId,
        "valor:",
        sessionId
      );
      console.log("🧱 vapi.start existe:", typeof vapi.start === "function");

      // Listener de erro global
      vapi.on("error", (err) => {
        console.error("🚨 Erro global Vapi:", err);
        console.error("🚨 Detalhes do erro:", JSON.stringify(err, null, 2));
      });

      // Iniciar chamada Vapi com assistantId correto
      const assistantId =
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ||
        "3900d262-ea58-4d12-ae5a-06090b4485b6";

      // Usar dados das props
      console.log("🔍 Usando dados das props:", { jobData, candidateData });

      const context = {
        job: {
          title: jobTitle,
          description: jobData?.description || "",
          requirements: jobData?.requirements || "",
          tags: jobData?.tags || [],
        },
        candidate: {
          name: candidateName,
          email: candidateData?.email || "",
        },
        script: jobData?.interviewScriptJson || {},
      };

      await vapi.start(assistantId, {
        variableValues: {
          context: JSON.stringify(context),
          candidateName,
          jobTitle,
          sessionId,
        },
      });

      // Listeners de eventos
      vapi.on("call-start", () => {
        console.log("📞 Chamada iniciada");
        setCallActive(true);
        setIsStarting(false);
      });

      vapi.on("call-end", () => {
        console.log("📞 Chamada finalizada");
        setCallActive(false);
        setStatus("completed");
        toast.success("Entrevista finalizada! Obrigado pela participação.");
      });

      vapi.on("error", (error: unknown) => {
        console.error("❌ Erro na chamada:", error);
        toast.error("Erro durante a entrevista");
        setCallActive(false);
        setIsStarting(false);
      });

      vapi.on("speech-start", () => {
        console.log("🎤 IA começou a falar");
      });

      vapi.on("speech-end", () => {
        console.log("🎤 IA parou de falar");
      });
    } catch (error) {
      console.error("Erro ao conectar Vapi:", error);
      toast.error("Erro ao conectar com o sistema de entrevista");
      setIsStarting(false);
    }
  }

  function handleEndCall() {
    if (window.confirm("Tem certeza que deseja encerrar a entrevista?")) {
      vapi.stop();
      setCallActive(false);
      setStatus("completed");
    }
  }

  function handleToggleMute() {
    if (isMuted) {
      vapi.setMuted(false);
      setIsMuted(false);
      toast.success("Microfone ativado");
    } else {
      vapi.setMuted(true);
      setIsMuted(true);
      toast.info("Microfone desativado");
    }
  }

  // Status já completado
  if (status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold">Entrevista Concluída!</h1>
          <p className="text-muted-foreground max-w-md">
            Obrigado por participar da entrevista comportamental para a vaga de{" "}
            <strong>{jobTitle}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Nossa equipe está analisando sua entrevista e entraremos em contato
            em breve.
          </p>
        </div>
      </div>
    );
  }

  // Status cancelado
  if (status === "cancelled") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold">Entrevista Cancelada</h1>
          <p className="text-muted-foreground max-w-md">
            Esta entrevista foi cancelada. Entre em contato com o recrutador
            para mais informações.
          </p>
        </div>
      </div>
    );
  }

  console.log("🎨 Renderizando InterviewRoom com status:", status);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{jobTitle}</h1>
        <Badge className="py-1 px-4 bg-primary/50 text-foreground rounded-sm">
          Entrevista Comportamental
        </Badge>
      </div>

      {/* Botão Iniciar (se ainda não iniciou) */}
      {!callActive && status === "scheduled" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 bg-muted/30 rounded-lg p-8">
          <div className="text-center space-y-4 max-w-2xl">
            <h2 className="text-3xl font-bold">Bem-vindo, {candidateName}!</h2>
            <p className="text-lg text-muted-foreground">
              Você está prestes a iniciar sua entrevista comportamental.
            </p>
            <div className="bg-background border rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold">📋 Instruções:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>A entrevista durará aproximadamente 15 minutos</li>
                <li>
                  Fale naturalmente, como se estivesse conversando com um
                  recrutador
                </li>
                <li>
                  Cite exemplos concretos e situações reais que você viveu
                </li>
                <li>Seja honesto e autêntico em suas respostas</li>
                <li>Certifique-se de que seu microfone está funcionando</li>
              </ul>
            </div>
            <Button
              size="lg"
              onClick={handleStartInterview}
              disabled={isStarting}
              className="gap-2 text-lg px-8 py-6"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando entrevista...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Iniciar Entrevista
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Sala de Entrevista (quando iniciada) */}
      {(callActive || isStarting || status === "in_progress") && (
        <>
          <div className="relative flex flex-col md:flex-row gap-4 w-full min-h-[60vh] md:min-h-[70vh]">
            <Agent type="user" name={candidateName} />
            <Agent type="ai" />
          </div>

          {/* Botão Reconectar (se status in_progress mas não conectado) */}
          {status === "in_progress" && !callActive && !isStarting && (
            <div className="flex justify-center mb-4">
              <Button onClick={() => connectToVapi("")} className="gap-2">
                <Mic className="w-4 h-4" />
                Reconectar à Entrevista
              </Button>
            </div>
          )}

          {/* Controles */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={handleToggleMute}
              className="gap-2"
            >
              {isMuted ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Desmutar
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Mutar
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              Encerrar Entrevista
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

