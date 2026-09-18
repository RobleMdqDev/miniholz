import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/orders";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartSync } from "@/components/cart/CartSync";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/** Beneficios fijos de la tienda. El primer mensaje lo edita el admin desde
 * /admin/configuracion (`StoreSettings.announcementText`). */
const FIXED_TOPBAR_MESSAGES = [
  "10% de descuento pagando con transferencia",
  "Grabado de nombre sin cargo en pedidos personalizados",
];

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [session, categories, settings] = await Promise.all([
    auth(),
    getCategories(),
    getStoreSettings(),
  ]);

  const messages = settings?.announcementText
    ? [settings.announcementText, ...FIXED_TOPBAR_MESSAGES]
    : FIXED_TOPBAR_MESSAGES;

  return (
    <>
      <TopBar messages={messages} />
      <Header user={session?.user} categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartSync userId={session?.user.id ?? null} />
      <CartDrawer />
    </>
  );
}
