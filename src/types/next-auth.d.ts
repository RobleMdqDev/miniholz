import type { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

// `next-auth/jwt` solo reexporta `@auth/core/jwt`, así que la interfaz a
// extender es la del paquete original.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
  }
}
