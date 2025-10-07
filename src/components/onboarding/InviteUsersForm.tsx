"use client";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { useTransition } from "react";
import { inviteUsersAction } from '@/actions/onboarding/inviteUsersAction';

// ✅ Schema com array dinâmico
const inviteUsersSchema = z.object({
  users: z
    .array(
      z.object({
        email: z.string().email("E-mail inválido"),
        role: z.enum(["OWNER", "RECRUITER", "INTERVIEWER", "VIEWER"]),
      })
    )
    .min(0, "Adicione pelo menos um usuário"),
});

type InviteUsersFormData = z.infer<typeof inviteUsersSchema>;

const verifyUsersArrayIsNotEmptyOrFilled = (
  users: InviteUsersFormData["users"]
) => {
  return users.some((user) => user.email && user.role);
};

const redirectToDashboard = () => {
  window.location.href = "/dashboard";
}


export default function InviteUsersForm() {
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<InviteUsersFormData>({
    resolver: zodResolver(inviteUsersSchema),
    defaultValues: {
      users: [{ email: "", role: "VIEWER" }],
    },
  });

  const { control, handleSubmit } = form;

  // ✅ Hook que manipula arrays dinamicamente
  const { fields, append, remove } = useFieldArray({
    control,
    name: "users",
  });

  
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Convide seus colaboradores</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form action={ async (formData) =>{
            startTransition(async () => {
              try {
                const response = await inviteUsersAction(formData);
                toast.success("Convites enviados com sucesso!");
                window.location.href = response.redirectUrl;
              } catch (error) {
                console.error(error);
                toast.error("Erro ao enviar convites");
              }
            });
          }} className="space-y-6">
            <fieldset className="space-y-6">
              <legend className="text-sm font-medium text-gray-600">
                Usuários a convidar
              </legend>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 rounded-md p-2"
                >
                  {/* Campo de e-mail */}
                  <FormField
                    control={control}
                    name={`users.${index}.email`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="usuario@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo de papel */}
                  <FormField
                    control={control}
                    name={`users.${index}.role`}
                    render={({ field }) => (
                      <FormItem className="w-48">
                        <FormLabel>Papel</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o papel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OWNER">
                                Proprietário
                              </SelectItem>
                              <SelectItem value="RECRUITER">
                                Recrutador
                              </SelectItem>
                              <SelectItem value="INTERVIEWER">
                                Entrevistador
                              </SelectItem>
                              <SelectItem value="VIEWER">
                                Visualizador
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Botão remover */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </fieldset>

            {/* Botão adicionar novo usuário */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ email: "", role: "RECRUITER" })}
              className="flex items-center gap-2"
            >
              <Plus size={14} />
              Adicionar usuário
            </Button>
            <hr className="my-6" />

            {verifyUsersArrayIsNotEmptyOrFilled(fields) ? (
              <Button type="submit" className="w-full">
                Enviar convites
              </Button>
            ) : (
              <Button onClick={redirectToDashboard} className="w-full">
                Convidar mais tarde
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
