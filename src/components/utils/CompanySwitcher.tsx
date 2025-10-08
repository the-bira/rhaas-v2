// src/components/utils/VersionSwitcher.tsx
"use client"

import * as React from "react"
import { ChevronsUpDown, Building2 } from "lucide-react";
import { Tenant } from "@/generated/prisma";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function CompanySwitcher({ tenant }: { tenant: Tenant }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                {tenant?.logoUrl ? (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={tenant.logoUrl} alt={tenant.name} />
                    <AvatarFallback>
                      <Building2 className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Building2 className="size-4" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 leading-none text-left">
                <span className="font-medium truncate max-w-[120px]">
                  {tenant.name || "Empresa"}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {tenant.about || "Sem descrição"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width]"
            align="start"
          >
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                {tenant.logoUrl ? (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={tenant.logoUrl} alt={tenant.name} />
                    <AvatarFallback>
                      <Building2 className="size-3" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                    <Building2 className="size-3" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{tenant.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tenant.website || "Sem website"}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/tenant">Configurações da Empresa</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Trocar Empresa</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}