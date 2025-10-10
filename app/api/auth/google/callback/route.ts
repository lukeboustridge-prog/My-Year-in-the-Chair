import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";
import { notifyApproversOfPendingUser } from "@/lib/notifications";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { Buffer } from "node:buffer";

function ensureEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function decodeState(value: string | undefined) {
  if (!value) return null;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(decoded) as { state: string; redirect?: string };
  } catch {
    return null;
  }
}

function safeRedirectPath(path: string | undefined) {
  if (!path) return "/dashboard";
  if (path.startsWith("/")) return path;
  return "/dashboard";
}

async function exchangeCode({
  code,
  redirectUri,
  clientId,
  clientSecret,
}: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Failed to exchange token: ${res.status}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    id_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type: string;
  }>;
}

async function fetchProfile(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }
  return res.json() as Promise<{
    id: string;
    email: string;
    verified_email?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }>;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state") || "";

  const stateCookie = cookies().get("google_oauth_state");
  const state = decodeState(stateCookie?.value);

  if (!code || !state || state.state !== stateParam) {
    console.error("google oauth callback state mismatch");
    const res = NextResponse.redirect(new URL("/login?error=oauth_state", req.url));
    res.cookies.set({ name: "google_oauth_state", value: "", path: "/", maxAge: 0 });
    return res;
  }

  try {
    const clientId = ensureEnv("GOOGLE_CLIENT_ID");
    const clientSecret = ensureEnv("GOOGLE_CLIENT_SECRET");
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const tokens = await exchangeCode({
      code,
      redirectUri,
      clientId,
      clientSecret,
    });

    const profile = await fetchProfile(tokens.access_token);

    if (!profile?.email) {
      throw new Error("Google profile missing email");
    }

    const email = profile.email.toLowerCase();
    const name = profile.name || `${profile.given_name ?? ""} ${profile.family_name ?? ""}`.trim() || null;

    let user = await db.user.findUnique({ where: { email } });

    let created = false;
    if (!user) {
      const passwordHash = await hash(randomBytes(32).toString("hex"), 10);
      user = await db.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "USER",
        },
      });
      created = true;
    } else if (!user.name && name) {
      user = await db.user.update({ where: { id: user.id }, data: { name } });
    }

    if (created) {
      await notifyApproversOfPendingUser({
        id: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
      }).catch((error) => {
        console.error("notifyApproversOfPendingUser", error);
      });
    }

    const token = signSession({ userId: user.id, email: user.email });
    const destination = safeRedirectPath(state.redirect);
    const redirectTarget = new URL(destination, origin);

    const res = NextResponse.redirect(redirectTarget);
    setSessionCookie(res, token);
    res.cookies.set({
      name: "google_oauth_state",
      value: "",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (error) {
    console.error("google oauth callback error", error);
    const res = NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
    res.cookies.set({ name: "google_oauth_state", value: "", path: "/", maxAge: 0 });
    return res;
  }
}
