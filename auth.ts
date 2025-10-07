import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const authHandler = NextAuth(authConfig);

export const { auth, signIn, signOut } = authHandler;
export const { GET, POST } = authHandler.handlers;
