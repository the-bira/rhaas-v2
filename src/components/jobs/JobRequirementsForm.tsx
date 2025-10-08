"use client";

import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { MarkdownEditor } from "../utils/MarkdownEditor";

export const JobRequirementsForm = () => {
  const form = useFormContext();
  if (!form) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="step3.requirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Requisitos</FormLabel>
            <FormControl>
              <MarkdownEditor
                value={field.value}
                onChange={(val) => field.onChange(val || "")}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="step3.responsibilities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reponsabilidades</FormLabel>
            <FormControl>
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
