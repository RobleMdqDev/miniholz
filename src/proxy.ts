import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// En Next.js 16 `middleware.ts` pasó a llamarse `proxy.ts`.
// Chequeo optimista: solo lee la sesión del JWT de la cookie, sin tocar la base
// de datos. La autorización real se revalida en cada layout y Server Action.
const { auth } = NextAuth(authConfig);

const AUTH_PAGES = ["/login", "/registro"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;

  if (AUTH_PAGES.includes(pathname) && session) {
    const destination = session.user.role === "ADMIN" ? "/admin" : "/cuenta";
    return NextResponse.redirect(new URL(destination, req.nextUrl));
  }

  const needsSession = pathname.startsWith("/cuenta") || pathname.startsWith("/admin");
  if (needsSession && !session) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && session?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/login", "/registro"],
};
