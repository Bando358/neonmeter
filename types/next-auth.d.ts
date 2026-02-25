import { Role } from "@/app/generated/prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      companyId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    companyId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    companyId: string | null
  }
}
