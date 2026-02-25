import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"
import { loginSchema } from "@/lib/validators/auth"
import type { Role } from "@/app/generated/prisma/client"

// Detect Vercel/HTTPS for secure cookies
const useSecureCookies =
  process.env.VERCEL === "1" ||
  process.env.AUTH_URL?.startsWith("https://")

const cookiePrefix = useSecureCookies ? "__Secure-" : ""

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.hashedPassword)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        }
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow same-origin URLs
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/dashboard`
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role
        token.companyId = (user as { companyId: string | null }).companyId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as Role
      session.user.companyId = (token.companyId as string | null) ?? null
      return session
    },
  },
})

// Export cookie name for middleware
export const SESSION_COOKIE_NAME = `${cookiePrefix}authjs.session-token`
