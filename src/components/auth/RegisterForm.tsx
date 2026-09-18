"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomer, type AuthFormState } from "@/actions/auth.actions";
import {
  FieldError,
  FormError,
  SubmitButton,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerCustomer, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />

      <div>
        <label htmlFor="name" className={labelClassName}>
          Nombre y apellido
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className={inputClassName}
          placeholder="Ana Pérez"
        />
        <FieldError messages={state.fieldErrors?.name} />
      </div>

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
        <label htmlFor="phone" className={labelClassName}>
          Teléfono <span className="font-normal text-brand-600">(opcional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(state.fieldErrors?.phone)}
          className={inputClassName}
          placeholder="11 5555 5555"
        />
        <FieldError messages={state.fieldErrors?.phone} />
      </div>

      <div>
        <label htmlFor="password" className={labelClassName}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          className={inputClassName}
          placeholder="Mínimo 8 caracteres"
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={labelClassName}>
          Repetir contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          className={inputClassName}
          placeholder="••••••••"
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      <SubmitButton pending={pending} pendingLabel="Creando cuenta…">
        Crear cuenta
      </SubmitButton>

      <p className="text-center text-sm text-brand-700">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-bold text-gold-700 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
