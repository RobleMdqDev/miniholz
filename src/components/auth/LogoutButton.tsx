import { logout } from "@/actions/auth.actions";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        Cerrar sesión
      </button>
    </form>
  );
}
