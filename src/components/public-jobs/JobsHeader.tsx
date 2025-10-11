import { WorkModel } from '@/enums/WorkModel';
import { Job, Tenant } from "@prisma/client";
import { Building2, MapPin, Globe2 } from "lucide-react";

type JobWithTenant = Job & { tenant: Tenant };

export function JobHeader({ job }: { job: JobWithTenant }) {
  return (
    <header className="border-b bg-muted/50 p-8 rounded-xl mb-8">
      <h1 className="text-3xl font-bold">{job.title}</h1>
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {job.tenant?.name && (
          <span className="flex items-center gap-1">
            <Building2 size={16} /> {job.tenant.name}
          </span>
        )}
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin size={16} /> {job.location}
          </span>
        )}
        {job.workModel && job.workModel in WorkModel && (
          <span className="flex items-center gap-1">
            <Globe2 size={16} /> {WorkModel[job.workModel as keyof typeof WorkModel]}
          </span>
        )}
      </div>
    </header>
  );
}
