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
import { Separator } from "@radix-ui/react-separator";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Button } from '../ui/button';
import { Input } from "../ui/input";
import { createCompanyAction } from "@/actions/onboarding/createCompanyAction";
import { toast } from "sonner";
import { useTransition } from "react";

const TenantWithUserPhoneNumberSchema = z.object({
  phoneNumber: z.string().min(10).max(11),
  tenant: z.object({
    name: z.string().min(1),
    about: z.string().optional(),
    logoType: z.enum(["upload", "url"]),
    logoUrl: z.string().optional().or(z.literal("")),
    logoFile: z.instanceof(File).optional(),
    website: z.string().optional().or(z.literal("")),
  }),
});

export default function CompanyForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof TenantWithUserPhoneNumberSchema>>({
    resolver: zodResolver(TenantWithUserPhoneNumberSchema),
    defaultValues: {
      phoneNumber: "",
      tenant: {
        name: "",
        about: "",
        logoType: "upload",
        logoUrl: "",
        logoFile: undefined,
        website: "",
      },
    },
  });

  const logoType = form.watch("tenant.logoType");

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Informações da empresa</CardTitle>
        <CardDescription>
          Preencha as informações da empresa para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            action={async (formData) => {
              // o Next chamará `createCompanyAction` no servidor
              startTransition(async () => {
                try {
                  const response = await createCompanyAction(formData);
                  toast.success("Empresa criada!");
                  window.location.href = response.redirectUrl;
                } catch (err) {
                  console.error(err);
                  toast.error("Erro ao criar empresa");
                }
              });
            }}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="phoneNumber"
              label="Número de telefone do USUÁRIO (somente números)"
              type="text"
              maskType="phone"
              placeholder="(00) 00000-0000"
              description="Número de telefone do usuário para contato"
            />

            <FormField
              control={form.control}
              name="tenant.name"
              label="Nome da empresa"
              type="text"
            />
            <FormField
              control={form.control}
              name="tenant.about"
              label="Sobre a empresa"
              type="textarea"
            />
            <FormFieldUI
              control={form.control}
              name="tenant.logoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Logo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange} // ✅ importante
                      value={field.value} // ✅ importante
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
                name="tenant.logoFile"
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
                name="tenant.logoUrl"
                label="URL da logo"
                type="text"
              />
            )}
            <FormField
              control={form.control}
              name="tenant.website"
              label="Website da empresa"
              type="text"
            />
            <Separator />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Continuar"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
