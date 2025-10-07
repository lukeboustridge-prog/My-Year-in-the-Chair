"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState =
  | { error: string; success?: undefined }
  | { success: true; error?: undefined };

const invalidState: LoginState = { error: "Please provide both email and password." };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return invalidState;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Unable to sign in right now. Please try again." };
      }
    }
    throw error;
  }

  return { success: true };
}
