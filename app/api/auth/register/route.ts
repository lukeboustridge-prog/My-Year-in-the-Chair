import { db } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { signSession, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().max(100).optional(),
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

    const name = parsed.data.name?.trim() || null;
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return new NextResponse("Email already in use", { status: 409 });
    }

    const passwordHash = await hash(password, 10);
    const user = await db.user.create({
      data: { email, name, passwordHash, role: "USER" },
    });

    const token = signSession({ userId: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error("register error", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
