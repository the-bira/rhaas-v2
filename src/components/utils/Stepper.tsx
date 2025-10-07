"use client";

import { cn } from "@/lib/utils";

interface StepperProps {
  step: number;
  totalSteps: number;
  labels?: string[];
}

export function Stepper({ step, totalSteps, labels }: StepperProps) {
  return (
    <div className="flex flex-col items-center mb-8 w-full">
      {/* Dots and Lines */}
      <div className="flex items-center justify-center w-full">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center w-full max-w-xs">
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

            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-all duration-300",
                  index < step ? "bg-primary" : "bg-primary/30"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Optional labels */}
      {labels && (
        <div className="flex justify-between w-full max-w-lg mt-2 text-xs text-muted-foreground">
          {labels.map((label, index) => (
            <span
              key={index}
              className={cn(
                "text-center w-1/5 truncate",
                index === step && "text-primary font-medium"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
