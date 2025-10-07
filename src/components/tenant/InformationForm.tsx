"use client";

import {
  Form,
  FormControl,
  FormField as FormFieldUI,
  FormItem,
  FormLabel,
} from "../ui/form";
import FormField from "@/components/utils/FormField";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createCompanyAction } from "@/actions/onboarding/createCompanyAction";
import { toast } from "sonner";
import { useEffect, useState, useTransition } from "react";
import { Industry } from "@/enums/Industry";
import { MarkdownEditor } from "../utils/MarkdownEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tenant } from "@/generated/prisma";
import { updateTenantInformation } from "@/actions/tenant/updateTenantInformation";
import { Skeleton } from '../ui/skeleton';

const TenantInformationFormSchema = z.object({
  name: z.string().min(1),
  about: z.string().optional(),
  longDescription: z.string().optional(),
  logoUrl: z.string().optional(),
  logoType: z.enum(["upload", "url"]),
  logoFile: z.instanceof(File).optional(),
  website: z.string().optional(),
  industry: z.enum(Object.keys(Industry) as [keyof typeof Industry, ...string[]]),
});

export default function TenantInformationForm({ tenant }: { tenant: Tenant }) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();


  const form = useForm<z.infer<typeof TenantInformationFormSchema>>({
    resolver: zodResolver(TenantInformationFormSchema),
    defaultValues: {
      name: tenant.name || "",
      about: tenant.about || "",
      longDescription: tenant.longDescription || "",
      logoUrl: tenant.logoUrl || "",
      logoType: tenant.logoUrl ? "url" : "upload",
      logoFile: undefined,
      website: "",
      industry:
        tenant.industry || Industry.OTHER,
    },
  });

  const logoType = form.watch("logoType");


  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !tenant) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Informações da empresa</CardTitle>
          <CardDescription>Carregando informações...</CardDescription>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-1/2" /> {/* Nome */}
            <Skeleton className="h-24 w-full" /> {/* Sobre */}
            <Skeleton className="h-[400px] w-full" /> {/* Markdown Editor */}
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" /> {/* Radio 1 */}
              <Skeleton className="h-10 w-24" /> {/* Radio 2 */}
            </div>
            <Skeleton className="h-10 w-full" /> {/* URL */}
            <Skeleton className="h-10 w-full" /> {/* Website */}
            <Skeleton className="h-10 w-full" /> {/* Select */}
            <Skeleton className="h-12 w-32" /> {/* Botão */}
          </CardContent>
        </CardHeader>
      </Card>
    );
  }
  

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Informações da empresa</CardTitle>
        <CardDescription>
          Preencha as informações da empresa para continuar.
        </CardDescription>
        <CardContent>
          <Form {...form}>
            <form
              className="flex flex-col gap-4 space-y-8"
              onSubmit={form.handleSubmit(async (values) => {
                const formData = new FormData();
                Object.entries(values).forEach(([key, value]) => {
                  if (value instanceof File) {
                    formData.append(key, value);
                  } else if (typeof value === "string") {
                    formData.append(key, value);
                  } else if (value != null) {
                    formData.append(key, JSON.stringify(value));
                  }
                });

                console.log("formData", formData.get("industry"));

                formData.forEach((value, key) => {
                  console.log("key", key, "value", value);
                });

                startTransition(async () => {
                  try {
                    const response = await updateTenantInformation(
                      tenant.id,
                      formData
                    );
                    toast.success("Informações atualizadas!");
                  } catch (err) {
                    console.error(err);
                    toast.error("Erro ao atualizar informações");
                  }
                });
              })}
            >
              <FormField
                control={form.control}
                name="name"
                label="Nome da empresa"
                type="text"
              />
              <FormField
                control={form.control}
                name="about"
                label="Sobre a empresa"
                type="textarea"
              />
              <FormFieldUI
                control={form.control}
                name="longDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição longa</FormLabel>
                    <FormControl>
                      <MarkdownEditor
                        value={field.value}
                        onChange={(val) => field.onChange(val || "")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormFieldUI
                control={form.control}
                name="logoType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Logo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <RadioGroupItem value="upload" id="upload" />
                          <FormLabel htmlFor="upload">Upload</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <RadioGroupItem value="url" id="url" />
                          <FormLabel htmlFor="url">URL</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              {logoType === "upload" ? (
                <FormFieldUI
                  control={form.control}
                  name="logoFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo da empresa</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="logoUrl"
                  label="URL da logo"
                  type="text"
                />
              )}
              <FormField
                control={form.control}
                name="website"
                label="Website da empresa"
                type="text"
              />
              <FormFieldUI
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indústria</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a indústria" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {Object.entries(Industry).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit">Salvar</Button>
            </form>
          </Form>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
