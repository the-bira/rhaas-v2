"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BanIcon,
  BriefcaseIcon,
  ChartBarIcon,
  HomeIcon,
  MegaphoneIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { CompanySwitcher } from "./CompanySwitcher";
import { Tenant } from "@/generated/prisma";

const items = [
  { title: "Dashboard", href: "/", icon: <HomeIcon /> },
  { title: "Jobs/Vagas", href: "/jobs", icon: <BriefcaseIcon /> },
  { title: "Candidatos", href: "/candidates", icon: <UserIcon /> },
  { title: "Talent Pool", href: "/talents", icon: <UsersIcon /> },
  { title: "Blacklist", href: "/blacklist", icon: <BanIcon /> },
  { title: "Entrevistas", href: "/interviews", icon: <MegaphoneIcon /> },
  { title: "Reports", href: "/reports", icon: <ChartBarIcon /> },
];

export function AppSidebar({ tenant }: { tenant: Tenant }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <CompanySwitcher tenant={tenant} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarMenu className="mt-4 flex flex-col gap-2 justify-center">
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <Link href={item.href}>
                  <span className=" flex items-center gap-2">
                    {item.icon}
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
