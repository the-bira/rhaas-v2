"use client";

import { useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form';
import { MarkdownEditor } from '../utils/MarkdownEditor';

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
         <MarkdownEditor
          value={field.value}
          onChange={(val) => field.onChange(val || "")}
          />
        )}
      />
    </div>
  );
};
