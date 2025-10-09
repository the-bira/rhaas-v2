"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { BellIcon, MoonIcon, SunIcon, PlusIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from 'react';

type User = {
  name?: string;
  image?: string;
  // Add other user properties as needed
};

export function AppHeader({ user }: { user: User }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-background border-b px-4 h-14 w-full">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        {/* <Input placeholder="Buscar candidato, vaga..." className="w-72" /> */}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-1">
          <PlusIcon className="w-4 h-4" /> Nova Vaga
        </Button>

        <Button variant="ghost" size="icon">
          <BellIcon className="w-5 h-5" />
        </Button>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user?.image ?? "/avatar.png"} />
              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
