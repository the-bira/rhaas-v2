// src/middleware.ts (criar novamente)
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db-edge";

export async function middleware(req: NextRequest) {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();

  if (!authed) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const userKinde = await getUser();
  const user = await db.user.findUnique({
    where: {
      kindeId: userKinde?.id,
    },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  
  // Buscar tenantId do usuário
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    select: { tenantId: true }
  });

  const res = NextResponse.next();
  res.headers.set("x-user-id", user?.id ?? "");
  res.headers.set("x-user-email", user?.email ?? "");
  res.headers.set("x-tenant-id", membership?.tenantId ?? ""); // ✅ Adicionar tenantId
  
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up|api/auth|job/).*)",
  ],
};