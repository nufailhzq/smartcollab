import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: Role;
      matricNum: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    matricNum?: string | null;
  }
}
