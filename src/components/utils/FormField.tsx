"use client";

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useCallback } from "react";

// Máscaras
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

// Regex de validação
export const regexValidators = {
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  phone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
};

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "file";
  maskType?: "cpf" | "cnpj" | "phone";
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  maskType,
}: FormFieldProps<T>) => {
  const handleChange = useCallback(
    (onChange: (value: string) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              onChange={handleChange(field.onChange)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormField;
