import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const COOKIE = "myyitc_session";

export function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return secret;
}

export function signSession(payload: object) {
  const token = jwt.sign(payload, requireSecret(), { expiresIn: "30d" });
  return token;
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  res.cookies.set({
    name: "access_token",
    value: token,
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: COOKIE,
    value: "",
    path: "/",
    secure: true,
    sameSite: "lax",
    maxAge: 0,
  });
  res.cookies.set({
    name: "access_token",
    value: "",
    path: "/",
    secure: true,
    sameSite: "lax",
    maxAge: 0,
  });
}

// ---- New helpers ----

/** Read and verify the JWT from the request cookies (server-only). */
export function getSession():
  | { userId: string; email?: string; [k: string]: any }
  | null {
  const c = cookies().get(COOKIE);
  if (!c?.value) return null;
  try {
    const data = jwt.verify(c.value, requireSecret());
    return data as any;
  } catch {
    return null;
  }
}

/** Convenience to read just the userId, or null if unauthenticated. */
export function getUserId(): string | null {
  const s = getSession();
  // @ts-ignore
  return s?.userId ?? null;
}
