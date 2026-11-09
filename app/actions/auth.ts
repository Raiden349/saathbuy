"use server";

import { redirect } from "next/navigation";
import { loginSchema, logoutSchema, safeReturnPath, signupSchema } from "@/lib/schemas";
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

export async function signOutAction(formData: FormData) {
  if (!logoutSchema.safeParse(formValues(formData)).success) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed-out");
}
