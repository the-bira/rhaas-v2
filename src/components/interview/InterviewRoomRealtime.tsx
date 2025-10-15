"use client";

import { useState } from "react";
import { Agent } from "./Agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { useOpenAIRealtime } from "@/hooks/useOpenAIRealtime";

function sanitize(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/[<>{}[\]()"'`;$]/g, "")
    .slice(0, 1000)
    .trim();
}

interface InterviewRoomProps {
  accessToken: string;
  jobTitle: string;
  candidateName: string;
  initialStatus: string;
}

export function InterviewRoomRealtime({
  accessToken,
  jobTitle,
  candidateName,
  initialStatus,
}: InterviewRoomProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  const {
    start,
    stop,
    isConnected,
    isAISpeaking,
    isCandidateSpeaking,
    timeRemaining,
  } = useOpenAIRealtime({
    sessionToken: sessionToken || "",
    durationMs: 15 * 60 * 1000, // 15 minutos
    onTranscript: (text) => {
      setTranscript((prev) => prev + text);
    },
    onAIResponse: (text) => {
      console.log("🤖 IA respondeu:", text);
    },
    onEnd: () => {
      handleEndInterview();
    },
  });

  async function handleStartInterview() {
    console.log("🎬 [Component] Iniciando entrevista...");
    setIsStarting(true);
    try {
      // 1. Iniciar sessão Realtime
      console.log("📡 [Component] Chamando API /api/interview/start");
      const res = await fetch("/api/interview/start", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: accessToken }),
      });

      const data = await res.json();
      console.log("📥 [Component] Resposta da API:", data);

      if (!data.success) {
        throw new Error(data.message || "Erro ao iniciar");
      }

      console.log("✅ [Component] Session token recebido:", data.sessionToken ? "OK" : "ERRO");
      const token = data.sessionToken;
      setSessionToken(token);
      setStatus("in_progress");

      // 2. Iniciar conexão Realtime diretamente com o token
      console.log("🔌 [Component] Iniciando hook useOpenAIRealtime com token...");
      await start(token);

      console.log("🎉 [Component] Entrevista iniciada com sucesso!");
      toast.success("Entrevista iniciada!");
    } catch (err) {
      console.error("❌ [Component] Erro ao iniciar:", err);
      toast.error("Erro ao iniciar entrevista.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleEndInterview() {
    stop("Entrevista encerrada pelo usuário");
    setStatus("completed");
    toast.success("Entrevista encerrada.");

    await fetch("/api/interview/end", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
  }

  const safeJobTitle = sanitize(jobTitle);
  const safeCandidateName = sanitize(candidateName);

  if (status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold">Entrevista Concluída!</h1>
          <p className="text-muted-foreground max-w-md">
            Obrigado por participar da entrevista para a vaga de{" "}
            <strong>{safeJobTitle}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Nossa equipe analisará sua entrevista em breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{safeJobTitle}</h1>
        <div className="flex items-center gap-2">
          <Badge className="py-1 px-4 bg-primary/50 text-foreground rounded-sm">
            Entrevista Comportamental
          </Badge>
          {isConnected && (
            <Badge variant="outline" className="gap-2">
              ⏱️ {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
            </Badge>
          )}
        </div>
      </div>

      {!isConnected && ["scheduled", "error"].includes(status) && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 bg-muted/30 rounded-lg p-8">
          <h2 className="text-3xl font-bold">
            Bem-vindo, {safeCandidateName}!
          </h2>
          <p className="text-lg text-muted-foreground">
            Clique no botão abaixo para iniciar sua entrevista.
          </p>
          <Button
            size="lg"
            onClick={handleStartInterview}
            disabled={isStarting}
            className="gap-2 text-lg px-8 py-6"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Iniciar Entrevista
              </>
            )}
          </Button>
        </div>
      )}

      {(isConnected || isStarting || status === "in_progress") && (
        <>
          <div className="relative flex flex-col md:flex-row gap-4 w-full min-h-[60vh] md:min-h-[70vh]">
            <Agent
              type="user"
              name={safeCandidateName}
              isSpeaking={isCandidateSpeaking}
            />
            <Agent type="ai" isSpeaking={isAISpeaking} />
          </div>

          {/* Transcrição em tempo real */}
          {transcript && (
            <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndInterview}
              className="gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              Encerrar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

