"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface AgentProps {
  type: "user" | "ai";
  name?: string;
  videoSrc?: string;
  className?: string;
  isSpeaking?: boolean;
}

export function Agent({
  type,
  name,
  videoSrc,
  className,
  isSpeaking = false,
}: AgentProps) {
  const isAI = type === "ai";

  return (
    <Card
      className={cn(
        "overflow-hidden border border-border rounded-xl relative",
        isAI
          ? "bg-gray-950 shadow-lg w-32 h-40 md:w-1/3 md:h-auto absolute md:relative bottom-4 right-4 md:bottom-auto md:right-auto z-20"
          : "flex-1 bg-black h-[calc(100vh-200px)] md:h-auto"
      )}
    >
      <CardContent className="p-0 w-full h-full flex items-center justify-center">
        {videoSrc ? (
          <video
            className={cn("w-full h-full object-cover", isAI && "opacity-90")}
            src={videoSrc}
            autoPlay
            muted
            playsInline
          />
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-white",
              isAI && "bg-gray-950"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-full font-semibold",
                isAI
                  ? "bg-primary/50 w-12 h-12 md:w-16 md:h-16"
                  : "bg-white/20 w-16 h-16 md:w-20 md:h-20"
              )}
            >
              {isSpeaking && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-5"></span>
              )}
              {isAI ? "IA" : name?.[0]?.toUpperCase() || "?"}
            </div>
            <p
              className={cn(
                "mt-2 text-xs md:text-sm text-muted-foreground text-center max-w-[160px]",
                isAI && "text-gray-300"
              )}
            >
              {isAI ? "Olá! Vamos começar nossa entrevista." : name || "Você"}
            </p>
          </div>
        )}

        {/* Nome fixo no canto inferior esquerdo (só para o usuário) */}
        {!isAI && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-sm px-3 py-1 rounded-md">
            {name || "Você"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
