"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Form } from "../ui/form";
import { toast } from "sonner";
import { CandidateApplicationForm } from "./CandidateApplicationForm";
import { createCandidateAction } from "@/actions/candidate/createCandidateAction";

const CandidateFormSchema = z.object({
  step1: z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Telefone é obrigatório"),
    linkedinUrl: z.string().url("URL inválida").optional().or(z.literal("")),
    resume: z.instanceof(File, { message: "Currículo é obrigatório" }),
    message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
  }),
});

export default function MultiStepCandidateForm({
  jobId,
  tenantId,
}: {
  jobId: string;
  tenantId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const form = useForm<z.infer<typeof CandidateFormSchema>>({
    resolver: zodResolver(CandidateFormSchema),
    defaultValues: {
      step1: {
        name: "",
        email: "",
        phone: "",
        linkedinUrl: "",
        message: "",
      },
    },
  });

  const totalSteps = 1;
  const labels = ["Candidate-se à vaga"];

  const onSubmit = async (values: z.infer<typeof CandidateFormSchema>) => {
    startTransition(async () => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      } else {
        try {
          const formData = new FormData();
          formData.append("jobId", jobId);
          formData.append("tenantId", tenantId);
          formData.append("name", values.step1.name);
          formData.append("email", values.step1.email);
          formData.append("phone", values.step1.phone);
          if (values.step1.linkedinUrl) {
            formData.append("linkedinUrl", values.step1.linkedinUrl);
          }
          formData.append("resume", values.step1.resume);
          formData.append("message", values.step1.message);
          
          await createCandidateAction(formData);
          toast.success("Candidatura enviada com sucesso!");
          window.location.href = `/job/${jobId}`;
        } catch (err) {
          console.error(err);
          toast.error("Erro ao enviar candidatura");
        }
      }
    });
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof z.infer<typeof CandidateFormSchema>)[] = [];

    switch (step) {
      case 0:
        fieldsToValidate = ["step1"];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);

    if (!isValid) {
      toast.error("Verifique os campos obrigatórios antes de continuar.");
      return;
    }

    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Card className="flex flex-col min-h-[600px]">
      <CardHeader>
        <CardTitle>{labels[step]}</CardTitle>
        <CardDescription>
          Preencha suas informações para candidatar-se à vaga.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              console.log(values);
            })}
            className="flex flex-col gap-4 h-full"
          >
            <div className="flex-1">
              {step === 0 && <CandidateApplicationForm />}
            </div>
            <div className="flex justify-end mt-auto pt-4 border-t">
              <Button type="button" onClick={handleNext} disabled={isPending} className="w-full">
                {isPending ? "Enviando..." : "Enviar candidatura"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

