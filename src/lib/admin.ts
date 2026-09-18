import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Para páginas del panel. El proxy ya filtró, pero nunca se confía solo en él:
 * un cambio de `matcher` o una ruta nueva dejarían la página sin protección.
 */
export async function requireAdminPage(): Promise<Session> {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}

/**
 * Para Server Actions. El proxy no las cubre de forma confiable (son POST a la
 * ruta donde se usan, y un cambio de matcher las dejaría sin chequear), así que
 * toda mutación de admin revalida el rol acá.
 */
export async function assertAdmin(): Promise<Session> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
