"use server";

import { db } from "@/db";
import { headers } from "next/headers";

export async function createJobAction(formData: FormData) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) throw new Error("Tenant not found");

  const tagsRaw = formData.getAll("tags") as string[];
  const uniqueTags = new Set(
    tagsRaw
      .flatMap((t) => t.split(","))
      .map((t) => t.trim())
      .filter(Boolean)
  );

  // 🔁 Garante que todas as tags existam no banco (upsert)
  const tags = await Promise.all(
    Array.from(uniqueTags).map(async (label) => {
      const existing = await db.jobTag.findFirst({
        where: { tag: label },
      });
      return existing
        ? existing
        : await db.jobTag.create({ data: { tag: label } });
    })
  );

  // 🧩 Cria o job com relacionamento
  const job = await db.job.create({
    data: {
      tenantId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      requirements: formData.get("requirements") as string,
      responsibilities: formData.get("responsibilities") as string,
      benefits: formData.get("benefits") as string,
      workModel: formData.get("workModel")?.toString() || "",
      contractType: formData.get("contractType")?.toString() || "",
      tags: {
        connect: tags.map((t) => ({ id: t.id })),
      },
    },
    include: { tags: true },
  });

  return job;
}
