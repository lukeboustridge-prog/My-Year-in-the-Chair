import { db } from "@/lib/db";
import { z } from "zod";
import { compare } from "bcryptjs";
import { signSession, setSessionCookie } from "@/lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response("Invalid", { status: 400 });
  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return new Response("Unauthorized", { status: 401 });
  const ok = await compare(password, user.passwordHash);
  if (!ok) return new Response("Unauthorized", { status: 401 });
  const token = signSession({ userId: user.id, email: user.email });
  const res = new Response(JSON.stringify({ ok: true }), { status: 200 });
  // @ts-ignore - Next runtime adds cookies on Response
  res.cookies.set(setSessionCookie(token));
  return res;
}
