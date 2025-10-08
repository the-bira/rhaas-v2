"use client";	

import { useFormContext } from 'react-hook-form';
import { Form,FormField as FormFieldUI } from '../ui/form';
import FormField from '../utils/FormField';
import { TagInput } from '../utils/TagInput';

export const JobInformationForm = () => {
  const form = useFormContext();
  if (!form) {
    return null;
  }
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
            onSearch={async (query) => {
              console.log(query);
              return [{ id: 1, label: 'Tag 1' }, { id: 2, label: 'Tag 2' }];
            }}
          />
        )}
      />
    </div>
  );
};