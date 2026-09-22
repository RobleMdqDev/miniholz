import { auth } from "@/lib/auth";
import { getCategories, getProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/orders";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartSync } from "@/components/cart/CartSync";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";

/** Beneficios fijos de la tienda. El primer mensaje lo edita el admin desde
 * /admin/configuracion (`StoreSettings.announcementText`). */
const FIXED_TOPBAR_MESSAGES = [
  "10% de descuento pagando con transferencia",
  "Grabado de nombre sin cargo en pedidos personalizados",
];

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [session, categories, settings, featured] = await Promise.all([
    auth(),
    getCategories(),
    getStoreSettings(),
    // Los tres productos más nuevos, para el bloque destacado del mega-menú.
    getProducts({ take: 3 }),
  ]);

  // Sin título no hay promo: es lo que permite apagarla desde el panel dejando
  // el campo vacío, sin tener que tocar código.
  const promo =
    settings?.menuPromoTitle && settings.menuPromoHref
      ? {
          title: settings.menuPromoTitle,
          subtitle: settings.menuPromoSubtitle,
          href: settings.menuPromoHref,
        }
      : null;

  const messages = settings?.announcementText
    ? [settings.announcementText, ...FIXED_TOPBAR_MESSAGES]
    : FIXED_TOPBAR_MESSAGES;

  return (
    <>
      {/* Van en el layout de la tienda y no en el raíz: describen el sitio
          público, y el panel de administración no se indexa ni le sirven. */}
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />

      <TopBar messages={messages} />
      <Header user={session?.user} categories={categories} featured={featured} promo={promo} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartSync userId={session?.user.id ?? null} />
      <CartDrawer />
    </>
  );
}
