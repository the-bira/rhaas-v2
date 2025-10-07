import SidebarGrip from "@/components/SidebarGrip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/utils/AppSidebar";
import { db } from "@/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) {
    return redirect("/sign-in");
  }
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  return (
    <SidebarProvider>
      {tenant && <AppSidebar tenant={tenant} />}
      <SidebarGrip />
      <main className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl w-full mx-auto p-4">
        {children}
      </main>
    </SidebarProvider>
  );
}
