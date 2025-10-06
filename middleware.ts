
export { auth as middleware } from "next-auth/middleware";
export const config = { matcher: ["/((?!login|api/auth|_next|favicon.ico).*)"] };
