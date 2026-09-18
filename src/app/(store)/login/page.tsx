import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { callbackUrl } = await props.searchParams;
  const safeCallbackUrl = typeof callbackUrl === "string" ? callbackUrl : "/cuenta";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">Ingresar</h1>
      <p className="mb-6 text-sm text-brand-600">
        Accedé a tu cuenta para ver tus pedidos y comprar más rápido.
      </p>
      <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm">
        <LoginForm callbackUrl={safeCallbackUrl} />
      </div>
    </div>
  );
}
