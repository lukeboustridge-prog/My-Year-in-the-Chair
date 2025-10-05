import { db } from "@/lib/db";
import { z } from "zod";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { signSession, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Invalid input", { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return new NextResponse("Invalid credentials", { status: 401 });

    const ok = await compare(password, user.passwordHash);
    if (!ok) return new NextResponse("Invalid credentials", { status: 401 });

    const token = signSession({ userId: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error("login error", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
