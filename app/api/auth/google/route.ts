import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Buffer } from "node:buffer";

function ensureEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function safeRedirect(input: string | null): string {
  if (!input) return "/dashboard";
  try {
    const url = new URL(input, "http://localhost");
    if (url.origin !== "http://localhost") return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    if (input.startsWith("/")) return input;
    return "/dashboard";
  }
}

export async function GET(req: Request) {
  try {
    const clientId = ensureEnv("GOOGLE_CLIENT_ID");
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const state = randomBytes(16).toString("hex");
    const search = new URL(req.url).searchParams;
    const redirect = safeRedirect(search.get("redirect"));

    const payload = Buffer.from(
      JSON.stringify({ state, redirect })
    ).toString("base64url");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("state", state);

    const res = NextResponse.redirect(authUrl);
    res.cookies.set({
      name: "google_oauth_state",
      value: payload,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    return res;
  } catch (error) {
    console.error("google oauth init error", error);
    return NextResponse.json({ error: "OAuth not available" }, { status: 500 });
  }
}
