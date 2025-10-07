"use server";

import { db } from "@/db";
import { Industry } from '@/generated/prisma';
import { Prisma, Tenant } from '@/generated/prisma';
import { vercelBlobUpload } from '@/lib/vercelBlobUpload';

export async function updateTenantInformation(tenantId: string, data: FormData) {
  console.log(data);
  console.log("tenantId", tenantId);

  const name = data.get("name") as string;
  const about = data.get("about") as string;
  const longDescription = data.get("longDescription") as string;
  const logoUrl = data.get("logoUrl") as string;
  const logoType = data.get("logoType") as string;
  const logoFile = data.get("logoFile") as File;
  const website = data.get("website") as string;
  const industry = Industry[data.get("industry") as keyof typeof Industry];
  console.log("industry", industry);

  let url = null;
  if (logoFile) {
    url = await vercelBlobUpload(logoFile);
  }

  const updateData: Prisma.TenantUpdateInput = {
    name,
    about,
    longDescription,
    logoUrl: logoType === "upload" ? url : logoUrl,
    website,
    industry: industry ? (industry as Industry) : undefined,
  };

  try{
    const exists = await db.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    if(!exists){
      throw new Error("Tenant not found");
    }

    const updated = await db.tenant.update({
      where: {
        id: tenantId,
      },
      data: updateData,
    });

    return {
      success: true,
      data: updated,
    };
  } catch(e){
    console.error(e)
    return {
      success: false,
      error: e,
    };
  }
}
