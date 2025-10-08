"use client";	

import { useFormContext } from 'react-hook-form';
import { FormField as FormFieldUI } from "../ui/form";
import FormField from '../utils/FormField';
import { TagInput } from '../utils/TagInput';

export const JobInformationForm = () => {
  const form = useFormContext();
  if (!form) {
    return null;
  }
  
  const handleCreateTag = async (tag: string) => {
    const response = await fetch("/api/tags", {
      method: "POST",
      body: JSON.stringify({ tag }),
    });
    const result = await response.json();
    return { id: result.id, label: result.tag };
  };

  const handleSearchTags = async (query: string) => {
    const response = await fetch("/api/tags/?query=" + query, {
      method: "GET",
    });
    const data = await response.json();
    return data.map((t: { id: string; tag: string }) => ({
      id: t.id,
      label: t.tag,
    }));
  };
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="step1.title"
        label="Título da vaga"
        type="text"
        size="large"
      />
      <FormFieldUI
        control={form.control}
        name="step1.tags"
        render={({ field }) => (
          <TagInput
            value={field.value}
            onChange={field.onChange}
            onSearch={async (query: string) => {
              if (query.length > 2) {
                return (await handleSearchTags(query)) as [];
              }
              return [];
            }}
            onCreate={async (tag: string) => {
              return await handleCreateTag(tag);
            }}
          />
        )}
      />
    </div>
  );
};