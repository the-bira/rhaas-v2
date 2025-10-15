"use client";

import { useEffect, useRef, useState } from "react";
import { Agent } from "./Agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";

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
  jobData?: {
    description?: string | null;
    requirements?: string | null;
    tags?: string[];
    interviewScriptJson?: unknown;
  };
  candidateData?: { email?: string | null };
}

export function InterviewRoom({
  accessToken,
  jobTitle,
  candidateName,
  initialStatus,
}: InterviewRoomProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isStarting, setIsStarting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callActive, setCallActive] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isAISpeaking = useRef(false); // ✅ Controla se IA está falando
  const hasPlayedIntro = useRef(false);
  const conversationHistory = useRef<string[]>([]);
  const audioChunksRef = useRef<Blob[]>([]); // ✅ Acumula chunks enquanto usuário fala
  const isSpeaking = useRef(false); // ✅ VAD: detecta se usuário está falando
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function cleanupInterview() {
    console.log("🧹 Limpando recursos...");
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      mediaRecorder.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    document.querySelectorAll("audio").forEach((a) => {
      try {
        a.pause();
        a.src = "";
        a.remove();
      } catch {}
    });
    isAISpeaking.current = false;
    isSpeaking.current = false;
    audioChunksRef.current = [];
  }

  async function handleStartInterview() {
    setIsStarting(true);
    try {
      await fetch("/api/interview/start", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: accessToken }),
      });

      await playIntro();
      await startMicLoop();

      setCallActive(true);
      setStatus("in_progress");
      toast.success("Entrevista iniciada!");
    } catch (err) {
      console.error("❌ Erro ao iniciar:", err);
      toast.error("Erro ao iniciar entrevista.");
    } finally {
      setIsStarting(false);
    }
  }

  async function playIntro() {
    if (hasPlayedIntro.current) return;
    hasPlayedIntro.current = true;

    const intro = sanitize(`
      Olá, prazer em te conhecer!
      Eu sou a entrevistadora virtual da Progressus TI.
      Vou conduzir esta entrevista para entender melhor seu perfil.
      Fique à vontade para responder naturalmente. Podemos começar?
    `);

    await speakText(intro);
  }

  // ✅ Função centralizada para IA falar
  async function speakText(text: string) {
    isAISpeaking.current = true;

    try {
      const res = await fetch("/api/interview/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy" }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          isAISpeaking.current = false; // ✅ IA terminou de falar
        };

        await audio.play();
      }
    } catch (err) {
      console.error("❌ TTS falhou:", err);
      isAISpeaking.current = false;
    }
  }

  // ⭐️ CORREÇÃO: Não concatena - envia chunk individual
  const handleSendAudioChunk = async (blob: Blob, mimeType: string) => {
    if (blob.size < 2000) return; // Ignora chunks muito pequenos

    const extension = mimeType.includes("ogg") ? "ogg" : "webm";
    const formData = new FormData();
    formData.append("file", blob, `audio.${extension}`);

    try {
      console.log("⬆️ Enviando chunk:", blob.size, "bytes");

      const sttRes = await fetch("/api/interview/stt/stream", {
        method: "POST",
        body: formData,
      });

      if (!sttRes.ok) {
        console.warn("⚠️ STT falhou");
        return;
      }

      const { text } = await sttRes.json();
      if (!text || text.trim().length < 2) return;

      console.log("🗣️ Candidato disse:", text);
      conversationHistory.current.push(`Candidato: ${text}`);

      // Resposta da IA
      const llmRes = await fetch("/api/interview/llm/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          context: {
            jobTitle,
            candidateName,
            history: conversationHistory.current.slice(-6),
          },
        }),
      });

      const reader = llmRes.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiResponse += decoder.decode(value, { stream: true });
        }
      }

      if (!aiResponse.trim()) return;

      console.log("�� IA respondeu:", aiResponse);
      conversationHistory.current.push(`IA: ${aiResponse}`);

      await speakText(aiResponse);
    } catch (err) {
      console.error("❌ Erro no envio:", err);
    }
  };

  async function startMicLoop() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    let mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/ogg;codecs=opus";
    }
    console.log("🎙️ Gravando em:", mimeType);

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorder.current = recorder;

    // ✅ VAD: Detecta quando usuário está falando
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const dataArray = new Float32Array(analyser.fftSize);
    const SILENCE_THRESHOLD = 0.01; // Ajustável
    const SILENCE_DURATION = 1500; // 1.5s de silêncio = fim da fala

    // Monitora volume do áudio
    const checkVoiceActivity = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const rms = Math.sqrt(
        dataArray.reduce((acc, val) => acc + val * val, 0) / dataArray.length
      );

      const isSilent = rms < SILENCE_THRESHOLD;

      if (!isSilent && !isSpeaking.current) {
        // Começou a falar
        console.log("🎤 Usuário começou a falar");
        isSpeaking.current = true;
        audioChunksRef.current = []; // Reset buffer

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      } else if (isSilent && isSpeaking.current) {
        // Silêncio detectado - aguarda tempo antes de processar
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        silenceTimeoutRef.current = setTimeout(() => {
          console.log("🔇 Usuário parou de falar - processando...");
          isSpeaking.current = false;
          processAccumulatedAudio(mimeType);
        }, SILENCE_DURATION);
      }
    };

    const vadInterval = setInterval(checkVoiceActivity, 100);

    // Envia chunks individuais (cada um é um webm válido)
    recorder.ondataavailable = async (event) => {
      if (isAISpeaking.current) return; // Não captura áudio da IA
      if (!event.data || event.data.size === 0) return;

      // Se usuário está falando, acumula
      if (isSpeaking.current) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.start(2000); // 2s chunks - maior = mais áudio por chunk válido

    // Limpeza
    const cleanup = () => {
      clearInterval(vadInterval);
      recorder.stop();
      audioContext.close();
    };

    window.addEventListener("beforeunload", cleanup);
  }

  // ✅ Processa áudio acumulado quando usuário para de falar
  async function processAccumulatedAudio(mimeType: string) {
    if (audioChunksRef.current.length === 0) return;

    // ⭐️ Pega todos os chunks acumulados
    const chunks = [...audioChunksRef.current];
    audioChunksRef.current = []; // Limpa buffer

    // Filtra chunks válidos (> 5KB)
    const validChunks = chunks.filter((chunk) => chunk.size >= 5000);

    if (validChunks.length === 0) return;

    // Envia o maior chunk (provavelmente tem mais fala)
    const largestChunk = validChunks.reduce((largest, current) =>
      current.size > largest.size ? current : largest
    );

    console.log(
      `📦 Processando maior chunk: ${largestChunk.size} bytes de ${chunks.length} chunks`
    );
    await handleSendAudioChunk(largestChunk, mimeType);
  }

  // REMOVEMOS AS FUNÇÕES DE WAV (concatenateChunks, createWavBlob, writeString, blobToBase64)
  // pois a solução ideal é WebM/Opus.

  async function handleEndInterview() {
    cleanupInterview();
    setStatus("completed");
    setCallActive(false);
    toast.success("Entrevista encerrada.");

    await fetch("/api/interview/end", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
  }

  function handleToggleMute() {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    setIsMuted(!isMuted);
    toast.info(isMuted ? "Microfone ativado" : "Microfone desativado");
  }

  useEffect(() => {
    return () => {
      cleanupInterview();
    };
  }, []);

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
        <Badge className="py-1 px-4 bg-primary/50 text-foreground rounded-sm">
          Entrevista Comportamental
        </Badge>
      </div>

      {!callActive && ["scheduled", "error"].includes(status) && (
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

      {(callActive || isStarting || status === "in_progress") && (
        <>
          <div className="relative flex flex-col md:flex-row gap-4 w-full min-h-[60vh] md:min-h-[70vh]">
            <Agent type="user" name={safeCandidateName} />
            <Agent type="ai" />
          </div>

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
