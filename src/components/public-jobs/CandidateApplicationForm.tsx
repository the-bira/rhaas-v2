"use client";

import { useFormContext } from 'react-hook-form';
import FormField from '../utils/FormField';
import { FormField as FormFieldUI, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export function CandidateApplicationForm() {
  const form = useFormContext();
  
  if (!form) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="step1.name"
        label="Nome completo"
        type="text"
        placeholder="Digite seu nome completo"
      />

      <FormField
        control={form.control}
        name="step1.email"
        label="Email"
        type="email"
        placeholder="seu@email.com"
      />

      <FormField
        control={form.control}
        name="step1.phone"
        label="Telefone"
        type="text"
        maskType="phone"
        placeholder="(11) 99999-9999"
      />

      <FormField
        control={form.control}
        name="step1.linkedinUrl"
        label="LinkedIn (opcional)"
        type="text"
        placeholder="https://linkedin.com/in/seu-perfil"
      />

      <FormFieldUI
        control={form.control}
        name="step1.resume"
        render={({ field: { onChange, value, ...fieldProps } }) => (
          <FormItem>
            <FormLabel>Currículo (PDF)</FormLabel>
            <FormControl>
              <Input
                {...fieldProps}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange(file);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormFieldUI
        control={form.control}
        name="step1.message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mensagem</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Conte-nos por que você seria ideal para esta vaga..."
                rows={6}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
