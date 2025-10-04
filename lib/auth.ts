import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE = "myyitc_session";

export type Session = { userId: string; email: string };

export function signSession(payload: Session) {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): Session | null {
  try {
    const secret = process.env.JWT_SECRET!;
    return jwt.verify(token, secret) as Session;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(token: string) {
  // used only in API routes via Response.cookies
  return { name: COOKIE, value: token, httpOnly: true, sameSite: "lax", path: "/" };
}

export function clearSessionCookie() {
  return { name: COOKIE, value: "", httpOnly: true, expires: new Date(0), path: "/" };
}
