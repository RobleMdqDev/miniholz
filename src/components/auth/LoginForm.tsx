"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/actions/auth.actions";
import {
  FieldError,
  FormError,
  SubmitButton,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";

const initialState: AuthFormState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <FormError message={state.error} />

      <div>
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className={inputClassName}
          placeholder="tunombre@email.com"
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div>
        <label htmlFor="password" className={labelClassName}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          className={inputClassName}
          placeholder="••••••••"
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <SubmitButton pending={pending} pendingLabel="Ingresando…">
        Ingresar
      </SubmitButton>

      <p className="text-center text-sm text-brand-700">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-bold text-gold-700 hover:underline">
          Creá una acá
        </Link>
      </p>
    </form>
  );
}
