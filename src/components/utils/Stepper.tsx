"use client";

import { cn } from "@/lib/utils";

interface StepperProps {
  step: number;
  totalSteps: number;
  labels?: string[];
}

export function Stepper({ step, totalSteps, labels }: StepperProps) {
  return (
    <div className="flex flex-col items-center min-w-[80%] mb-8 mx-auto">
      <div className="flex flex-col items-center w-full">
        {/* Dots e linhas */}
        <div className="flex items-center justify-between w-full">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex flex-col items-center w-full">
              {/* Dot */}
              <div className="flex items-center justify-center relative">
                <div
                  className={cn(
                    "w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out",
                    index <= step
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/30 bg-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index <= step ? "bg-primary-foreground" : "bg-transparent"
                    )}
                  />
                </div>

                {/* Linha de conexão */}
                {index < totalSteps - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 absolute left-[calc(50%+10px)] top-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out",
                      index < step ? "bg-primary" : "bg-primary/30"
                    )}
                    style={{
                      minWidth: "60px", // equivalente a min-w-15
                      maxWidth: "226px", // equivalente a max-w-56.5
                      width: "clamp(60px, 15vw, 226px)", // cresce proporcional à viewport
                    }}
                  />
                )}
              </div>

              {/* Label abaixo do dot */}
              {labels && labels[index] && (
                <div
                  className={cn(
                    "mt-2 text-xs text-center text-muted-foreground max-w-[80px] leading-tight",
                    index === step && "text-primary font-medium"
                  )}
                >
                  {labels[index]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
