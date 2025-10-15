import { InterviewRoomRealtime } from "@/components/interview/InterviewRoomRealtime";
import { getInterviewForCandidateAction } from "@/actions/candidate/startInterviewSessionAction";
import { redirect } from "next/navigation";

interface InterviewPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InterviewPage({
  searchParams,
}: InterviewPageProps) {
  const params = await searchParams;
  const accessToken = params.token as string;

  if (!accessToken) {
    redirect("/");
  }

  // Buscar dados da entrevista usando token de acesso
  const result = await getInterviewForCandidateAction(accessToken);

  console.log("🔍 Resultado da busca da entrevista:", result);

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold text-destructive">
            Acesso Inválido
          </h1>
          <p className="text-muted-foreground max-w-md">{result.error}</p>
          <p className="text-sm text-muted-foreground">
            Se você recebeu um link de entrevista, verifique se copiou
            corretamente ou entre em contato com o recrutador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InterviewRoomRealtime
      accessToken={accessToken}
      jobTitle={result.interview.jobTitle}
      candidateName={result.interview.candidateName || "Candidato"}
      initialStatus={result.interview.status}
    />
  );
}
