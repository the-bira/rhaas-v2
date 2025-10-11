"use client";

import { useState, useEffect } from "react";
import { Linkedin, Twitter, Link as LinkIcon } from "lucide-react";
import { Job, Tenant } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type JobWithTenant = Job & { tenant: Tenant };

export function JobShareButtons({ job }: { job: JobWithTenant }) {
  const [url, setUrl] = useState("");
  const text = `Confira esta vaga: ${job.title} na ${job.tenant?.name}`;

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <div className="flex gap-2 mt-8">
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        <LinkIcon size={16} /> Copiar link
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
        >
          <Linkedin size={16} /> LinkedIn
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`} target="_blank">
          <Twitter size={16} /> Twitter
        </a>
      </Button>
    </div>
  );
}
