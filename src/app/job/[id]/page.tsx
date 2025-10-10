import { JobSection } from '@/components/public-jobs/JobSection';
import { JobShareButtons } from '@/components/public-jobs/JobShareButtons';
import { JobHeader } from '@/components/public-jobs/JobsHeader';
import { JobMeta } from '@/components/public-jobs/JobsMeta';
import { JobApplyForm } from '@/components/public-jobs/JobApplyForm';
import { ThemeToggle } from '@/components/public-jobs/ThemeToggle';
import { db } from '@/db';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const job = await db.job.findUnique({
    where: { id, publishedAt: { not: null } },
    include: { tenant: true },
  });

  if (!job) {
    return {
      title: "Vaga não encontrada",
      description: "Esta vaga não existe ou foi removida.",
    };
  }

  const description = job.description
    ? job.description.replace(/<[^>]*>/g, "").slice(0, 150)
    : "Oportunidade disponível na " + job.tenant?.name;

  return {
    title: `${job.title} | ${job.tenant?.name ?? "Vaga"}`,
    description,
    openGraph: {
      title: job.title,
      description,
      type: "website",
      url: `https://seusite.com/jobs/${job.id}`,
      images: [
        job.tenant?.logoUrl
          ? { url: job.tenant.logoUrl, width: 1200, height: 630, alt: job.title }
          : { url: "/og-default.png", width: 1200, height: 630, alt: job.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: job.title,
      description,
      images: [job.tenant?.logoUrl || "/og-default.png"],
    },
  };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await db.job.findUnique({
    where: { id },
    include: {
      tags: true,
      tenant: true,
    },
  });

  if (!job) return notFound();

  // Verificar se a vaga pode ser visualizada publicamente
  // Regras:
  // 1. Se publicada (publishedAt) e ativa (isActive) → público pode ver
  // 2. Se rascunho ou inativa → apenas o tenant dono pode ver (preview)

  const isPublished = job.publishedAt !== null && job.isActive;

  if (!isPublished) {
    // Vaga não publicada - verificar se é o tenant dono
    const { getKindeServerSession } = await import(
      "@kinde-oss/kinde-auth-nextjs/server"
    );
    const { isAuthenticated, getUser } = getKindeServerSession();
    const authed = await isAuthenticated();

    if (!authed) {
      // Usuário não autenticado não pode ver rascunho
      return notFound();
    }

    const userKinde = await getUser();
    const user = await db.user.findUnique({
      where: { kindeId: userKinde?.id },
      include: {
        memberships: {
          where: { tenantId: job.tenantId },
        },
      },
    });

    // Se não for membro do tenant dono, não pode ver
    if (!user || user.memberships.length === 0) {
      return notFound();
    }
  }

  return (
    <>
      <ThemeToggle />
      <main className="container mx-auto py-10 px-4 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Conteúdo principal */}
          <div className="lg:col-span-2 space-y-8">
            <JobHeader job={job} />
            <JobMeta job={job} />

            {job.description && (
              <JobSection title="📘 Descrição da vaga" html={job.description} />
            )}
            {job.requirements && (
              <JobSection title="✅ Requisitos" html={job.requirements} />
            )}
            {job.responsibilities && (
              <JobSection
                title="🧠 Responsabilidades"
                html={job.responsibilities}
              />
            )}
            {job.benefits && (
              <JobSection title="🎁 Benefícios" html={job.benefits} />
            )}

            <JobShareButtons job={job} />
          </div>

          {/* Formulário de candidatura */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <JobApplyForm jobId={job.id} tenantId={job.tenantId} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

