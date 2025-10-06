import type { AuthConfig } from "next-auth";

export const authConfig: AuthConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }: { session: any; token: Record<string, unknown> }) {
      if (session?.user && typeof token?.sub === "string") {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
