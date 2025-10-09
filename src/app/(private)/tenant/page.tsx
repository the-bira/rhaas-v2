export const dynamic = "force-dynamic";

import TenantTabs from "@/components/tenant/Tabs";
import { db } from "@/db";
import { headers } from "next/headers";

const fetchTenant = async () => {
  try {
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return new Response(JSON.stringify({ error: "Tenant ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      return new Response(JSON.stringify({ error: "Tenant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(tenant), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("API /tenant failed:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export default async function TenantPage() {
  const tenant = await fetchTenant();
  const tenantData = await tenant.json();

  return (
    <>
      <TenantTabs tenant={tenantData} />
    </>
  );
}
