import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db-edge";

export async function middleware(req: NextRequest) {
  // Permitir acesso sem autenticação para rotas específicas
  if (req.nextUrl.pathname.startsWith("/api/inngest")) {
    return NextResponse.next();
  }

  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();

  if (!authed) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const kindeUser = await getUser();

  if (!kindeUser || !kindeUser.email) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 🧠 Busca tanto por kindeId quanto por email (garante compatibilidade)
  let dbUser = await db.user.findFirst({
    where: {
      OR: [{ kindeId: kindeUser.id }, { email: kindeUser.email }],
    },
  });

  // ⚙️ Se já existir, garante que o kindeId está vinculado
  if (dbUser) {
    if (!dbUser.kindeId) {
      dbUser = await db.user.update({
        where: { id: dbUser.id },
        data: { kindeId: kindeUser.id },
      });
    }
  } else {
    // 🪄 Se não existir, cria o usuário no banco
    dbUser = await db.user.create({
      data: {
        kindeId: kindeUser.id,
        email: kindeUser.email,
        name: `${kindeUser.given_name ?? ""} ${kindeUser.family_name ?? ""}`.trim(),
      },
    });
  }

  // Buscar tenantId do usuário
  const membership = await db.membership.findFirst({
    where: { userId: dbUser.id },
    select: { tenantId: true },
  });

  if (!membership) {
    // Redirecionar para onboarding se não tiver tenant
    return NextResponse.redirect(new URL("/onboarding/company", req.url));
  }

  // ✅ Usuário autenticado e com tenant, adiciona headers e continua
  const res = NextResponse.next();
  res.headers.set("x-user-id", dbUser.id);
  res.headers.set("x-user-email", dbUser.email);
  res.headers.set("x-tenant-id", membership.tenantId);

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up|api/auth|api/inngest|job/|onboarding|interview).*)",
  ],
};
