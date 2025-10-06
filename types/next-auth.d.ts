declare module "next-auth" {
  interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }

  interface Session {
    user: SessionUser;
    expires: string;
  }

  type SessionCallback = (params: {
    session: Session;
    token: Record<string, unknown>;
  }) => Session | Promise<Session>;

  interface AuthConfig {
    session?: { strategy?: "jwt" | "database" };
    providers?: unknown[];
    pages?: Record<string, string>;
    callbacks?: {
      session?: SessionCallback;
    };
  }

  interface AuthHelpers {
    handlers: {
      GET: (request: unknown) => unknown;
      POST: (request: unknown) => unknown;
    };
    auth: (request: unknown) => Promise<Session | null>;
    signIn: (...args: unknown[]) => Promise<unknown>;
    signOut: (...args: unknown[]) => Promise<unknown>;
  }

  const NextAuth: (config: AuthConfig) => AuthHelpers;

  export default NextAuth;
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
  }
}
