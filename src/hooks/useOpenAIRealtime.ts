"use client";

import { useEffect, useRef, useState } from "react";

interface UseRealtimeProps {
  sessionToken: string;
  durationMs?: number;
  onTranscript?: (text: string) => void;
  onAIResponse?: (text: string) => void;
  onEnd?: () => void;
}

export function useOpenAIRealtime({
  sessionToken,
  durationMs = 15 * 60 * 1000,
  onTranscript,
  onAIResponse,
  onEnd,
}: UseRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(durationMs / 1000);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isEndingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const silenceCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sessionReadyRef = useRef(false);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  function stopAudioPlayback() {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsAISpeaking(false);
  }

  function playNextAudio() {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    if (!audioContextRef.current) return;

    isPlayingRef.current = true;
    setIsAISpeaking(true);

    const buffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    sourceRef.current = source;

    source.onended = () => {
      isPlayingRef.current = false;
      if (audioQueueRef.current.length > 0) playNextAudio();
      else setIsAISpeaking(false);
    };

    source.start();
  }

  async function start(tokenOverride?: string) {
    const token = tokenOverride || sessionToken;
    isEndingRef.current = false;

    const ws = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview`,
      ["realtime", `openai-insecure-api-key.${token.trim()}`]
    );

    wsRef.current = ws;

    ws.onopen = async () => {
      console.log("✅ [Realtime] Conectado");
      setIsConnected(true);
      startTimeRef.current = Date.now();

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      ws.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            instructions:
              "Você é uma entrevistadora profissional e empática da RHaaS. Fale devagar, em português, e só responda depois que o candidato terminar de falar.",
          },
        })
      );

      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, durationMs - elapsed);
        setTimeRemaining(Math.floor(remaining / 1000));
        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          stop("Tempo esgotado");
        }
      }, 1000);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      const src = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      src.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);
        let hasSound = false;
        for (let i = 0; i < input.length; i++) {
          const s = input[i];
          pcm16[i] = s * 0x7fff;
          if (Math.abs(s) > 0.02) hasSound = true;
        }

        if (hasSound) {
          silenceCountRef.current = 0;
          if (!isCandidateSpeaking) {
            console.log("🗣️ [Mic] Candidato começou a falar");
            setIsCandidateSpeaking(true);
            stopAudioPlayback(); // ✅ para a IA se o candidato começar
          }
        } else {
          silenceCountRef.current++;
          if (
            silenceCountRef.current > 35 &&
            isCandidateSpeaking &&
            !isProcessingRef.current
          ) {
            console.log("🤫 [Mic] Candidato terminou de falar");
            setIsCandidateSpeaking(false);
            isProcessingRef.current = true;
            ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
            ws.send(JSON.stringify({ type: "response.create", response: {} }));
          } else if (silenceCountRef.current > 35 && isProcessingRef.current) {
            // ainda processando — ignora
          }
        }

        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer))),
          })
        );
      };
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "session.updated") {
        sessionReadyRef.current = true;
        ws.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Olá! Sou a entrevistadora virtual da RHaaS. Você está me ouvindo bem?",
            },
          })
        );
      }

      if (data.type === "conversation.item.input_audio_transcription.completed") {
        onTranscript?.(data.transcript);
      }

      if (data.type === "response.output_audio.delta") {
        try {
          const binary = atob(data.delta);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);

          const buffer = audioContextRef.current!.createBuffer(
            1,
            bytes.length / 2,
            24000
          );
          const view = new DataView(bytes.buffer);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < channelData.length; i++) {
            channelData[i] = view.getInt16(i * 2, true) / 32768.0;
          }

          audioQueueRef.current.push(buffer);
          playNextAudio();
        } catch (err) {
          console.error("❌ [Audio] Erro processando:", err);
        }
      }

      if (data.type === "response.done") {
        isProcessingRef.current = false;
      }

      if (data.type === "error") {
        console.error("❌ [OpenAI Error]:", data);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      stopAudioPlayback();
      if (!isEndingRef.current) {
        isEndingRef.current = true;
        onEnd?.();
      }
    };
  }

  function stop(reason = "Encerrando...") {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    wsRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    clearInterval(timerRef.current!);
    stopAudioPlayback();
    onEnd?.();
  }

  useEffect(() => () => stop("Desmontando"), []);

  return {
    start,
    stop,
    isConnected,
    isAISpeaking,
    isCandidateSpeaking,
    timeRemaining,
  };
}
