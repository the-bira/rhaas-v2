// src/components/tenant/Tabs.tsx
"use client";

import { Tenant } from '@/generated/prisma';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";

// carregue o form apenas no client
const TenantInformationForm = dynamic(() => import("./InformationForm"), {
  ssr: false,
});

const tabs = [
  { label: "Informações", value: "information" },
  { label: "Usuários", value: "users" },
  { label: "Endereços", value: "addresses" },
  { label: "Contatos", value: "contacts" },
];

export default function TenantTabs({ tenant }: { tenant: Tenant }) {
  return (
    <Suspense
      fallback={
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Informações da empresa</CardTitle>
            <CardDescription>Carregando informações...</CardDescription>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-1/2" /> {/* Nome */}
              <Skeleton className="h-24 w-full" /> {/* Sobre */}
              <Skeleton className="h-[400px] w-full" /> {/* Markdown Editor */}
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24" /> {/* Radio 1 */}
                <Skeleton className="h-10 w-24" /> {/* Radio 2 */}
              </div>
              <Skeleton className="h-10 w-full" /> {/* URL */}
              <Skeleton className="h-10 w-full" /> {/* Website */}
              <Skeleton className="h-10 w-full" /> {/* Select */}
              <Skeleton className="h-12 w-32" /> {/* Botão */}
            </CardContent>
          </CardHeader>
        </Card>
      }
    >
      <Tabs className="w-full flex gap-4" defaultValue="information">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 👇 Esse conteúdo só existe no client */}
        <TabsContent value="information">
          <TenantInformationForm tenant={tenant} />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
