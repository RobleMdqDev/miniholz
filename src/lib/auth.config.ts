import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compartida sin providers: la importa `proxy.ts`, que corre
 * antes de cada request y no debe cargar Prisma ni bcrypt.
 * El provider de credenciales se agrega en `src/lib/auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
