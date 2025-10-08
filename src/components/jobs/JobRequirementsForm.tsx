"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "../ui/form";
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
          <MarkdownEditor
            value={field.value}
            onChange={(val) => field.onChange(val || "")}
          />
        )}
      />
      <FormField
        control={form.control}
        name="step3.responsibilities"
        render={({ field }) => (
          <MarkdownEditor
            value={field.value}
            onChange={(val) => field.onChange(val || "")}
          />
        )}
      />
    </div>
  );
};
