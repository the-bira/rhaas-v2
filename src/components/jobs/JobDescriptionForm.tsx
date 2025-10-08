"use client";

import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { MarkdownEditor } from "../utils/MarkdownEditor";
import { Button } from "../ui/button";
import { Loader2, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const JobDescriptionForm = () => {
  const form = useFormContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      toast.info("Gerando descrição com IA...");
      const response = await fetch("/api/generate-description", {
        method: "POST",
        body: JSON.stringify({
          title: form.getValues("step1.title"),
          tags: form.getValues("step1.tags"),
        }),
      });
      const { description, requirements, responsibilities } =
        await response.json();

      form.setValue("step2.description", description);
      form.setValue("step3.requirements", requirements);
      form.setValue("step3.responsibilities", responsibilities);
      toast.success("Descrição gerada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar descrição com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!form) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="step2.description"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-8">
            <div className="flex gap-2 justify-between">
              <FormLabel className="text-lg font-medium">Descrição</FormLabel>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                Gerar com IA <SparklesIcon className="w-4 h-4" />{" "}
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              </Button>
            </div>
            <FormControl className="">
              <MarkdownEditor
                value={field.value}
                onChange={(val) => field.onChange(val || "")}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
