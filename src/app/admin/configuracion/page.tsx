import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/orders";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";

export const metadata: Metadata = {
  title: "Configuración",
};

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Configuración de la tienda</h1>
        <p className="text-sm text-brand-600">
          Estos datos se muestran en el checkout y en la barra de anuncios, y se cambian sin tocar
          código.
        </p>
      </div>

      <StoreSettingsForm
        settings={{
          whatsappNumber: settings?.whatsappNumber ?? "",
          bankAccountInfo: settings?.bankAccountInfo ?? "",
          announcementText: settings?.announcementText ?? null,
          menuPromoTitle: settings?.menuPromoTitle ?? null,
          menuPromoSubtitle: settings?.menuPromoSubtitle ?? null,
          menuPromoHref: settings?.menuPromoHref ?? null,
        }}
      />
    </div>
  );
}
