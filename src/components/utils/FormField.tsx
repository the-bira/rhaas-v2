"use client";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // ✅ Import do componente textarea
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useCallback, useId } from "react";

// ==========================
// 🔢 Máscaras
// ==========================
const applyMask = (value: string, maskType?: string): string => {
  const digits = value.replace(/\D/g, "");

  switch (maskType) {
    case "cpf":
      return digits
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    case "cnpj":
      return digits
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");

    case "phone":
      if (digits.length <= 10) {
        return digits
          .replace(/^(\d{2})(\d)/g, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      }
      return digits
        .slice(0, 11)
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");

    default:
      return value;
  }
};

// ==========================
// ✅ Regex Validators (caso queira validar com Zod também)
// ==========================
export const regexValidators = {
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  phone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
};

// ==========================
// ⚙️ Componente genérico de campo
// ==========================
interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "file" | "textarea";
  maskType?: "cpf" | "cnpj" | "phone";
  description?: string;
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  maskType,
  description,
}: FormFieldProps<T>) => {
  const stableId = useId() + "-" + name.replace(/\./g, "-");

  const handleChange = useCallback(
    (onChange: (value: string) => void) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const masked = applyMask(e.target.value, maskType);
        e.target.value = masked;
        onChange(masked);
      },
    [maskType]
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={stableId}>{label}</FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                id={stableId}
                {...field}
                placeholder={placeholder}
                onChange={handleChange(field.onChange)}
                rows={4}
              />
            ) : (
              <Input
                {...field}
                id={stableId}
                type={type}
                placeholder={placeholder}
                onChange={handleChange(field.onChange)}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormField;
