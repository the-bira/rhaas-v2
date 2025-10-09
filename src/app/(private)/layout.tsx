import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/utils/AppSidebar";
import { AppHeader } from "@/components/utils/Header";
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
  const userId = headersList.get("x-user-id");

  console.log(userId, tenantId);

  if (!userId || !tenantId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { tenant: true } } },
  });

  console.log(user);

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
        {/* 🧭 Sidebar fixa à esquerda */}
        <aside
          data-sidebar
          className="group/sidebar relative z-20 border-r bg-card transition-all duration-300 ease-in-out data-[state=open]:w-64 data-[state=collapsed]:w-[4.5rem] flex-shrink-0"
        >
          <AppSidebar tenant={user.memberships[0].tenant!} />
        </aside>

        {/* 🌐 Conteúdo principal */}
        <div className="flex flex-col flex-1 relative z-10">
          {/* Header fixo (acima apenas do conteúdo, não da sidebar) */}
          <header className="sticky top-0 z-30 bg-background border-b shadow-sm">
            <AppHeader
              user={{
                name: user.name ?? undefined,
                image: user.image ?? undefined,
              }}
            />
          </header>

          {/* Conteúdo da página */}
          <main className="flex-1 overflow-y-auto p-6 w-full">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
