import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin";
import { getPendingTransferCount } from "@/lib/admin-queries";
import { LogoutButton } from "@/components/auth/LogoutButton";

const ADMIN_LINKS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/pedidos", label: "Pedidos", badge: "pendingTransfers" as const },
  { href: "/admin/configuracion", label: "Configuración" },
];

export const metadata: Metadata = {
  title: {
    default: "Administración",
    template: "%s | Admin MiniHolz",
  },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Defensa en profundidad: el proxy ya filtró, pero cada Server Action de admin
  // también revalida el rol por su cuenta.
  const session = await requireAdminPage();
  const pendingTransfers = await getPendingTransferCount();

  const badgeFor = (link: (typeof ADMIN_LINKS)[number]) =>
    link.badge === "pendingTransfers" && pendingTransfers > 0 ? (
      <span
        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 text-xs font-bold text-white"
        title="Transferencias esperando confirmación"
      >
        {pendingTransfers}
      </span>
    ) : null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-50 md:flex-row">
      {/* Móvil: barra compacta fija, con las secciones en scroll horizontal. El
          sidebar completo ocupaba media pantalla antes de mostrar contenido. */}
      <header className="sticky top-0 z-20 border-b border-brand-200 bg-white md:hidden">
        <div className="flex items-center gap-3 px-4 py-2">
          <Link href="/" aria-label="MiniHolz — ir a la tienda" className="shrink-0">
            <Image
              src="/images/logo-circular.png"
              alt="MiniHolz"
              width={512}
              height={512}
              className="h-10 w-10"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-brand-600">Administración</p>
            <p className="truncate text-sm font-semibold text-brand-900">{session.user.name}</p>
          </div>
          <LogoutButton className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-100" />
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Secciones del panel">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200 px-3.5 py-2 text-sm font-medium text-brand-800"
            >
              {link.label}
              {badgeFor(link)}
            </Link>
          ))}
        </nav>
      </header>

      <aside className="hidden border-brand-200 bg-white p-4 md:block md:w-60 md:border-r">
        <Link href="/" className="mb-1 block w-fit" aria-label="MiniHolz — ir a la tienda">
          <Image
            src="/images/logo-circular.png"
            alt="MiniHolz"
            width={512}
            height={512}
            className="h-12 w-12"
          />
        </Link>
        <p className="mb-4 text-xs uppercase tracking-wide text-brand-600">Administración</p>

        <nav className="flex flex-col gap-1 text-sm">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 font-medium text-brand-800 hover:bg-brand-100"
            >
              {link.label}
              {badgeFor(link)}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t border-brand-200 pt-4">
          <p className="truncate text-sm font-semibold text-brand-900">{session.user.name}</p>
          <p className="mb-2 truncate text-xs text-brand-600">{session.user.email}</p>
          <LogoutButton className="text-sm font-medium text-brand-600 hover:text-brand-900 hover:underline" />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
