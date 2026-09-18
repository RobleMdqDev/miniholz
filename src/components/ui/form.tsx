export const labelClassName = "mb-1 block text-sm font-semibold text-brand-800";

export const inputClassName =
  "min-h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-base sm:text-sm text-brand-900 outline-none transition placeholder:text-brand-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 aria-[invalid=true]:border-danger-500";

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-danger-600">
      {messages[0]}
    </p>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700"
    >
      {message}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
  pendingLabel,
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
