import { Badge } from "@/components/ui/badge";
import { Job, JobTag } from "@prisma/client";

type JobWithTags = Job & { tags: JobTag[] };

export function JobMeta({ job }: { job: JobWithTags }) {
  return (
    <section className="flex flex-wrap gap-2 mb-6">
      {job.tags.map((t: JobTag ) => (
        <Badge key={t.id} variant="secondary">
          {t.tag}
        </Badge>
      ))}
    </section>
  );
}
