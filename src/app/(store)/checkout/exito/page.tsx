import type { Metadata } from "next";
import { MercadoPagoReturn } from "@/components/checkout/MercadoPagoReturn";

export const metadata: Metadata = {
  title: "Pago aprobado",
};

export default async function PaymentSuccessPage(props: PageProps<"/checkout/exito">) {
  return <MercadoPagoReturn outcome="success" searchParams={await props.searchParams} />;
}
