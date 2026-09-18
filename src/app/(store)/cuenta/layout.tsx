import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/LogoutButton";

const ACCOUNT_LINKS = [
  { href: "/cuenta", label: "Mis datos" },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
];

export default async function AccountLayout({ children }: LayoutProps<"/cuenta">) {
  // Defensa en profundidad: el proxy ya filtró, pero nunca se confía solo en él.
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/cuenta");

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-brand-200 bg-white p-4">
        <p className="mb-1 text-xs uppercase tracking-wide text-brand-600">Mi cuenta</p>
        <p className="mb-4 truncate font-bold text-brand-900">{session.user.name}</p>
        <nav className="flex flex-col gap-1 text-sm">
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 font-medium text-brand-800 hover:bg-brand-100"
            >
              {link.label}
            </Link>
          ))}
          <LogoutButton className="mt-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-100" />
        </nav>
      </aside>

      <section>{children}</section>
    </div>
  );
}
