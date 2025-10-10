import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  return <RegisterForm googleEnabled={googleEnabled} />;
}
