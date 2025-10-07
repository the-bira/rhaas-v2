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
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createCompanyAction } from "@/actions/onboarding/createCompanyAction";
import { toast } from "sonner";
import { useTransition } from "react";
import { MarkdownEditor } from "../utils/MarkdownEditor";
import { Select, SelectTrigger, SelectValue } from "../ui/select";

const JobsFormSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().min(1),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  seniority: z.string().optional(),
  workModel: z.enum(["Remoto", "Híbrido", "Presencial"]),
  location: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  industry: z.string().optional(),
  contractType: z.enum(["CLT", "PJ", "Freelancer"]),
  workSchedule: z.enum(["Integral", "Parcial", "Turno"]),
  salaryRangeMin: z.number().optional(),
  salaryRangeMax: z.number().optional(),
  salaryCurrency: z.enum([
    "BRL",
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "CHF",
    "CNY",
    "JPY",
    "KRW",
    "MXN",
    "NZD",
    "RUB",
    "SEK",
    "SGD",
    "THB",
    "TRY",
    "ZAR",
  ]),
  tags: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

export default function JobsForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof JobsFormSchema>>({
    resolver: zodResolver(JobsFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      seniority: "",
      workModel: "Remoto",
      location: "",
      country: "",
      city: "",
      department: "",
      industry: "",
      contractType: "CLT",
      workSchedule: "Integral",
      salaryRangeMin: 0,
      salaryRangeMax: 0,
      salaryCurrency: "BRL",
      tags: [],
      skills: [],
    },
  });

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Vaga</CardTitle>
        <CardDescription>
          Preencha as informações da vaga para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            action={async (formData) => {
              startTransition(async () => {
                console.log(formData);
                // try {
                //   const response = await createJobAction(formData);
                //   toast.success("Vaga criada!");
                //   window.location.href = response.redirectUrl;
                // } catch (err) {
                //   toast.error("Erro ao criar vaga");
                // }
              });
            }}
          >
            <FormField
              control={form.control}
              name="title"
              label="Título"
              type="text"
            />
            <FormField
              control={form.control}
              name="subtitle"
              label="Subtítulo"
              type="text"
            />
            <FormFieldUI
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
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

            <FormFieldUI
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Requisitos</FormLabel>

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
              name="responsibilities"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Responsabilidades</FormLabel>

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
              name="benefits"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Benefícios</FormLabel>

                  <FormControl>
                    <MarkdownEditor
                      value={field.value}
                      onChange={(val) => field.onChange(val || "")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seniority"
              label="Senioridade"
              type="text"
            />

            <FormFieldUI
              control={form.control}
              name="workModel"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Modelo de Trabalho</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Criar Vaga</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
