"use client";

import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { MarkdownEditor } from "../utils/MarkdownEditor";

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
          <FormItem>
            <FormLabel>Descrição</FormLabel>
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
