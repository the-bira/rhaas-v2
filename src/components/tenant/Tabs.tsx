// src/components/tenant/Tabs.tsx
"use client";

import { Tenant } from '@/generated/prisma';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import dynamic from "next/dynamic";

// carregue o form apenas no client
const TenantInformationForm = dynamic(
  () => import("./InformationForm"),
  { ssr: false }
);

const tabs = [
  { label: "Informações", value: "information" },
  { label: "Usuários", value: "users" },
  { label: "Endereços", value: "addresses" },
  { label: "Contatos", value: "contacts" },
];

export default function TenantTabs({ tenant }: { tenant: Tenant }) {
  return (
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
  );
}
