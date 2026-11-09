"use server";

import { redirect } from "next/navigation";
import { loginSchema, logoutSchema, passwordResetCompleteSchema, passwordResetRequestSchema, safeReturnPath, signupSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function signInAction(formData: FormData) {
  const parsed = loginSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/login?issue=invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) redirect("/login?issue=credentials");

  redirect(safeReturnPath(parsed.data.next));
}

export async function signUpAction(formData: FormData) {
  const parsed = signupSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/signup?issue=invalid");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : siteUrl;
  if (!origin) redirect("/signup?issue=configuration");

  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", "/");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        department: parsed.data.department,
        student_type: parsed.data.student_type,
      },
      emailRedirectTo: callback.toString(),
    },
  });

  if (error) redirect("/signup?issue=failed");
  if (data.session) redirect("/");
  redirect("/signup?notice=check-email");
}

export async function requestPasswordResetCode(email: string) {
  const parsed = passwordResetRequestSchema.safeParse({ email });
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
    if (error) return { ok: false, message: "We couldn’t send a code right now. Please wait a moment and try again." };
    return { ok: true, message: "If an account uses that email, a six-digit reset code is on its way. Check your inbox and spam folder." };
  } catch {
    return { ok: false, message: "Password reset is temporarily unavailable. Please try again later." };
  }
}

export async function completePasswordReset(input: { email: string; token: string; password: string; confirm_password: string }) {
  const parsed = passwordResetCompleteSchema.safeParse(input);
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((issue) => issue.path[0] === "confirm_password");
    return { ok: false, message: mismatch ? "The passwords don’t match." : "Enter the six-digit code and a password with at least 6 characters." };
  }

  try {
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: "recovery",
    });
    if (verifyError) return { ok: false, message: "That code is invalid or expired. Request a new one and try again." };

    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (updateError) return { ok: false, message: "We couldn’t update your password. Please request a new code and try again." };
    return { ok: true, message: "Your password has been changed. You can now continue to SaathBuy." };
  } catch {
    return { ok: false, message: "Password reset is temporarily unavailable. Please try again later." };
  }
}

export async function signOutAction(formData: FormData) {
  if (!logoutSchema.safeParse(formValues(formData)).success) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed-out");
}
