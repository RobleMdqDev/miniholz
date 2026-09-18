import type { Metadata } from "next";
import { MercadoPagoReturn } from "@/components/checkout/MercadoPagoReturn";

export const metadata: Metadata = {
  title: "Pago rechazado",
};

export default async function PaymentFailurePage(props: PageProps<"/checkout/fallo">) {
  return <MercadoPagoReturn outcome="failure" searchParams={await props.searchParams} />;
}
