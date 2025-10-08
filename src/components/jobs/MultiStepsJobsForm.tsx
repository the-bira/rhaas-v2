"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Stepper } from "../utils/Stepper";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Job, JobTag } from "@/generated/prisma";
import { WorkModel } from "@/enums/WorkModel";
import { Form } from "../ui/form";
import { JobInformationForm } from "./JobInformationForm";
import { toast } from "sonner";
import { JobDescriptionForm } from "./JobDescriptionForm";
import { JobRequirementsForm } from "./JobRequirementsForm";
import { JobBenefitsForm } from "./JobBenefitsForm";
import { createJobAction } from "@/actions/jobs/createJobAction";

const JobFormSchema = z.object({
  step1: z.object({
    title: z.string().min(1, "O título é obrigatório"),
    tags: z
      .array(
        z.object({
          label: z.string().min(1, "Tag inválida"),
        })
      )
      .min(1, "Adicione pelo menos uma tag"),
  }),
  step2: z.object({
    description: z.string().min(1).max(10000),
  }),
  step3: z.object({
    requirements: z.string().optional(),
    responsibilities: z.string().optional(),
  }),
  step4: z.object({
    workModel: z.enum(
      Object.keys(WorkModel) as [keyof typeof WorkModel, ...string[]]
    ),
    benefits: z.string().optional(),
  }),
});

type JobWithTags = Job & { tags?: JobTag[] };

export default function MultiStepsJobsForm({
  job,
}: {
  job: JobWithTags | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const form = useForm<z.infer<typeof JobFormSchema>>({
    resolver: zodResolver(JobFormSchema),
    defaultValues: {
      step1: job
        ? {
            title: job.title,
            tags:
              job.tags?.map((tag: { id: string; tag: string }) => ({
                label: tag.tag,
              })) || [],
          }
        : {
            title: "",
            tags: [],
          },
      step2: job
        ? {
            description: job.description,
          }
        : {
            description: "",
          },
      step3: {
        requirements: job?.requirements || "",
        responsibilities: job?.responsibilities || "",
      },
      step4: {
        workModel: job?.workModel || WorkModel.REMOTE,
        benefits: job?.benefits || "",
      },
    },
  });

  const totalSteps = 4;
  const labels = [
    "Informações da vaga",
    "Descrição da vaga",
    "Requisitos da vaga",
    "Benefícios da vaga",
  ];

  const onSubmit = async (values: z.infer<typeof JobFormSchema>) => {
    startTransition(async () => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      } else {
        try {
          const formData = new FormData();
          formData.append("title", values.step1.title);
          formData.append(
            "tags",
            values.step1.tags.map((tag) => tag.label).join(",")
          );
          formData.append("description", values.step2.description);
          formData.append("requirements", values.step3.requirements || "");
          formData.append(
            "responsibilities",
            values.step3.responsibilities || ""
          );
          formData.append("workModel", values.step4.workModel);
          formData.append("benefits", values.step4.benefits || "");
          const response = await createJobAction(formData);
          toast.success("Vaga criada!");
          window.location.href = "/jobs";
        } catch (err) {
          console.error(err);
          toast.error("Erro ao criar vaga");
        }
      }
    });
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleNext = async () => {
    // 🔍 Determina quais campos devem ser validados no step atual
    let fieldsToValidate: (keyof z.infer<typeof JobFormSchema>)[] = [];

    switch (step) {
      case 0:
        fieldsToValidate = ["step1"];
        break;
      case 1:
        fieldsToValidate = ["step2"];
        break;
      case 2:
        fieldsToValidate = ["step3"];
        break;
      case 3:
        fieldsToValidate = ["step4"];
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
    <Card className="flex flex-col min-h-[calc(100vh-8rem)]">
      <CardHeader>
        <CardTitle>{labels[step]}</CardTitle>
        <CardDescription>
          Preencha as informações da vaga para continuar.
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
            <Stepper step={step} totalSteps={totalSteps} labels={labels} />
            <div className="flex-1">
              {step === 0 && <JobInformationForm />}
              {step === 1 && <JobDescriptionForm />}
              {step === 2 && <JobRequirementsForm />}
              {step === 3 && <JobBenefitsForm />}
            </div>
            <div className="flex justify-between mt-auto pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0}
                onClick={handleBack}
              >
                Voltar
              </Button>

              <Button type="button" onClick={handleNext} disabled={isPending}>
                {step === totalSteps - 1 ? "Criar vaga" : "Próximo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
