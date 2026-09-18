import type { Metadata } from "next";
import { MercadoPagoReturn } from "@/components/checkout/MercadoPagoReturn";

export const metadata: Metadata = {
  title: "Pago pendiente",
};

export default async function PaymentPendingPage(props: PageProps<"/checkout/pendiente">) {
  return <MercadoPagoReturn outcome="pending" searchParams={await props.searchParams} />;
}
