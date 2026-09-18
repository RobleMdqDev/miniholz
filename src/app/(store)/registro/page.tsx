import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">Crear cuenta</h1>
      <p className="mb-6 text-sm text-brand-600">
        Guardá tus datos de envío y seguí el estado de tus pedidos.
      </p>
      <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
