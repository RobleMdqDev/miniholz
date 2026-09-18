import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-extrabold text-brand-900">Mis datos</h1>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-brand-600">Nombre</dt>
          <dd className="font-semibold text-brand-900">{session?.user.name}</dd>
        </div>
        <div>
          <dt className="text-brand-600">Email</dt>
          <dd className="font-semibold text-brand-900">{session?.user.email}</dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-brand-600">
        La edición de datos y direcciones llega junto con el checkout.
      </p>
    </div>
  );
}
