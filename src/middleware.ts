import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Rotas públicas (sem auth)
  const publicPaths = [
    "/sign-in",
    "/sign-up",
    "/api/auth/kinde", // 🔥 importante permitir toda a árvore do Kinde
    "/favicon.ico",
    "/_next",
    "/public",
  ];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2️⃣ Checa sessão Kinde
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 3️⃣ Se autenticado, segue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
