"use client";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  FormField as FormFieldUI,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control, FieldValues, Path } from "react-hook-form";
import { useCallback, useId } from "react";
import { cn } from "@/lib/utils";

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

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "file" | "textarea";
  maskType?: "cpf" | "cnpj" | "phone";
  description?: string;
  size?: "small" | "normal" | "big" | "large";
}

const sizeClasses = {
  small: {
    input: "h-8 text-sm px-2",
    label: "text-sm",
    description: "text-xs text-muted-foreground",
  },
  normal: {
    input: "h-10 text-base px-3",
    label: "text-base",
    description: "text-sm text-muted-foreground",
  },
  big: {
    input: "h-12 text-base px-4",
    label: "text-lg font-medium",
    description: "text-base text-muted-foreground",
  },
  large: {
    input: "h-14 text-xl font-semibold px-5",
    label: "text-xl font-bold",
    description: "text-lg text-muted-foreground",
  },
};

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  maskType,
  description,
  size = "normal",
}: FormFieldProps<T>) => {
  const stableId = useId() + "-" + String(name).replace(/\./g, "-");

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
    <FormFieldUI
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={stableId} className={cn(sizeClasses[size].label)}>
            {label}
          </FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                id={stableId}
                {...field}
                placeholder={placeholder}
                onChange={handleChange(field.onChange)}
                className={cn(sizeClasses[size].input)}
                rows={size === "small" ? 2 : size === "large" ? 6 : 4}
              />
            ) : (
              <Input
                {...field}
                id={stableId}
                type={type}
                placeholder={placeholder}
                onChange={handleChange(field.onChange)}
                className={cn(sizeClasses[size].input)}
              />
            )}
          </FormControl>
          {description && (
            <FormDescription className={cn(sizeClasses[size].description)}>
              {description}
            </FormDescription>
          )}
          <FormMessage />{" "}
          {/* agora funciona porque há contexto do FormFieldUI */}
        </FormItem>
      )}
    />
  );
};

export default FormField;
