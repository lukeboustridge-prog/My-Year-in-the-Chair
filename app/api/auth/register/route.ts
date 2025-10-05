import { db } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";
import { signSession, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response("Invalid input", { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return new Response("Email already in use", { status: 409 });
    }

    const passwordHash = await hash(password, 10);
    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        role: "USER"
      }
    });

    // Auto-sign in
    const token = signSession({ userId: user.id, email: user.email });
    const res = new Response(JSON.stringify({ ok: true }), { status: 201 });
    // @ts-ignore - Next runtime Response has cookies helper
    res.cookies.set(setSessionCookie(token));
    return res;
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}
