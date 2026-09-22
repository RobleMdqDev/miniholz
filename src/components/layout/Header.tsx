import Image from "next/image";
import Link from "next/link";
import { MessageCircleQuestion, Search, ShieldCheck, User } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { CartIcon } from "@/components/cart/CartIcon";
import type { ProductCardData } from "@/lib/catalog";
import { MobileMenu } from "./MobileMenu";
import { NavDropdown } from "./NavDropdown";
import { MegaMenuPanel, type MenuPromo } from "./MegaMenuPanel";

type HeaderUser = { name?: string | null; role: Role };
type HeaderCategory = { slug: string; name: string };

const NAV_LINKS_BEFORE = [{ href: "/", label: "Inicio" }];

const NAV_LINKS_AFTER = [
  { href: "/novedades", label: "Novedades" },
  { href: "/quienes-somos", label: "Quiénes Somos" },
  { href: "/como-comprar", label: "Cómo Comprar" },
  { href: "/contacto", label: "Contacto" },
];

export function Header({
  user,
  categories,
  featured,
  promo,
}: {
  user?: HeaderUser | null;
  categories: HeaderCategory[];
  featured: ProductCardData[];
  promo: MenuPromo | null;
}) {
  const firstName = user?.name?.trim().split(" ")[0];
  const storeCategories = categories.map((category) => ({
    href: `/productos/categoria/${category.slug}`,
    label: category.name,
  }));

  return (
    <>
      {/* En el móvil queda fija solo esta franja: el menú y el carrito tienen
          que estar siempre a mano, pero 110px fijos comen demasiada pantalla.
          El buscador va afuera, así se va con el scroll. */}
      <header className="sticky top-0 z-30 border-b border-brand-200 bg-brand-100 text-brand-900 md:static md:border-b-0">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:gap-6 md:py-4">
          <MobileMenu
            links={[...NAV_LINKS_AFTER, { href: "/ayuda", label: "Ayuda" }]}
            categories={storeCategories}
            isLoggedIn={Boolean(user)}
            isAdmin={user?.role === "ADMIN"}
            userName={firstName}
          />

          <Link href="/" aria-label="MiniHolz — inicio" className="shrink-0">
            <Image
              src="/images/logo-circular.png"
              alt="MiniHolz"
              width={512}
              height={512}
              priority
              className="h-14 w-14 md:h-20 md:w-20"
            />
          </Link>

          <div className="hidden md:block md:flex-1">
            <SearchField />
          </div>

          <div className="ml-auto flex items-center gap-1 text-xs font-medium md:gap-5">
            <Link
              href="/ayuda"
              aria-label="Ayuda"
              className={`${iconLinkClass} hidden md:flex`}
            >
              <MessageCircleQuestion className="h-5 w-5" aria-hidden />
              <span className="hidden lg:inline">Ayuda</span>
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                aria-label="Administración"
                className={`${iconLinkClass} hidden md:flex`}
              >
                <ShieldCheck className="h-5 w-5" aria-hidden />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            <Link
              href={user ? "/cuenta" : "/login"}
              aria-label={user ? "Mi cuenta" : "Ingresar"}
              className={`${iconLinkClass} lg:max-w-24`}
            >
              <User className="h-5 w-5" aria-hidden />
              <span className="hidden truncate lg:inline">
                {firstName ? `Hola, ${firstName}` : "Mi cuenta"}
              </span>
            </Link>

            <CartIcon />
          </div>
        </div>

        <nav className="relative hidden border-t border-brand-200 md:block">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm font-medium tracking-[1px]">
            {NAV_LINKS_BEFORE.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gold-700"
              >
                {link.label}
              </Link>
            ))}
            <NavDropdown label="Tienda Online">
              <MegaMenuPanel categories={storeCategories} featured={featured} promo={promo} />
            </NavDropdown>
            {NAV_LINKS_AFTER.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gold-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* El buscador ocupa su propia fila en el móvil, donde no entra al lado del logo. */}
      <div className="border-b border-brand-200 bg-brand-100 px-4 pb-3 md:hidden">
        <SearchField />
      </div>
    </>
  );
}

// Área táctil de 44px aunque el ícono sea de 20.
const iconLinkClass =
  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-1 transition hover:bg-brand-200";

function SearchField() {
  return (
    <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-brand-500">
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <input
        type="search"
        placeholder="¿Qué estás buscando?"
        aria-label="Buscar productos"
        className="w-full bg-transparent text-sm text-brand-900 outline-none placeholder:text-brand-500"
      />
    </label>
  );
}
