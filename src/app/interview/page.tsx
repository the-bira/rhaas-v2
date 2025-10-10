import { Agent } from "@/components/interview/Agent";
import { Badge } from "@/components/ui/badge";

export default async function InterviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Desenvolvedor Full Stack</h1>
        <Badge className="py-1 px-4 bg-primary/50 text-foreground rounded-sm">
          Entrevista Comportamental e personalidade
        </Badge>
      </div>

      <div className="relative flex flex-col md:flex-row gap-4 w-full min-h-[60vh] md:min-h-[70vh]">
        <Agent type="user" name="Você" />

        {/* IA */}
        <Agent type="ai" />
      </div>
    </div>
  );
}
