"use client";

import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { MarkdownEditor } from "../utils/MarkdownEditor";
import { Button } from "../ui/button";
import { SparklesIcon } from "lucide-react";

export const JobDescriptionForm = () => {
  const form = useFormContext();
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
              <Button variant="outline">
                Gerar com IA <SparklesIcon className="w-4 h-4" />
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
