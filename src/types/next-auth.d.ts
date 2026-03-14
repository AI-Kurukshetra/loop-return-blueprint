import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      merchantId: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    merchantId?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    merchantId?: string;
    role?: string;
  }
}
