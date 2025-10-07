import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const credentials = Credentials({
  name: "Email and Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  authorize: async (creds) => {
    const email = typeof creds?.email === "string" ? creds.email : undefined;
    const password = typeof creds?.password === "string" ? creds.password : undefined;
    if (!email || !password) return null;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const bcrypt = await import("bcryptjs");
    const compare =
      typeof bcrypt.compare === "function"
        ? bcrypt.compare
        : typeof bcrypt.default?.compare === "function"
          ? bcrypt.default.compare
          : null;
    if (!compare) return null;
    const ok = await compare(password, user.password);
    if (!ok) return null;
    return { id: user.id, email: user.email, name: user.name ?? user.email };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [credentials],
});
