import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = new Response(null, { status: 204 });
  // @ts-ignore
  res.cookies.set(clearSessionCookie());
  return res;
}
