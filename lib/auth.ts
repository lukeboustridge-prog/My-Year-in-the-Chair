import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

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
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
}
