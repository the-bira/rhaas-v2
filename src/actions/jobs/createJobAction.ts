"use server";

import { db } from "@/db";
import { headers } from "next/headers";

export async function createJobAction(formData: FormData) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Tenant not found");
  }

  const tags = formData.getAll("tags") as string[];

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

      // 🔥 conecta ou cria tags dinamicamente
      tags: {
        connectOrCreate: tags.map((tag) => ({
          where: { tag },
          create: { tag },
        })),
      },
    },
    include: {
      tags: true, // opcional: retorna as tags junto
    },
  });

  return job;
}
