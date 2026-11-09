"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestProductSchema, requestVoteSchema } from "@/lib/schemas";
import { getRequestUser } from "@/lib/supabase/request-user";

export async function createRequestAction(formData: FormData) {
  const parsed = requestProductSchema.safeParse({ title: formData.get("title"), note: formData.get("note") });
  if (!parsed.success) redirect("/request?issue=invalid");
  const [supabase, user] = await Promise.all([createClient(), getRequestUser()]);
  if (!user) redirect("/login?next=%2Frequest");
  const { error } = await supabase.from("deal_requests").insert({ user_id: user.id, title: parsed.data.title, note: parsed.data.note || null });
  if (error) redirect("/request?issue=save");
  redirect("/request?notice=added");
}

export async function toggleRequestVoteAction(formData: FormData) {
  const parsed = requestVoteSchema.safeParse({ request_id: formData.get("request_id") });
  if (!parsed.success) redirect("/request?issue=invalid");
  const [supabase, user] = await Promise.all([createClient(), getRequestUser()]);
  if (!user) redirect("/login?next=%2Frequest");
  const { data: existing } = await supabase.from("request_votes").select("request_id").eq("request_id", parsed.data.request_id).eq("user_id", user.id).maybeSingle();
  const result = existing
    ? await supabase.from("request_votes").delete().eq("request_id", parsed.data.request_id).eq("user_id", user.id)
    : await supabase.from("request_votes").insert({ request_id: parsed.data.request_id, user_id: user.id });
  if (result.error) redirect("/request?issue=vote");
  redirect("/request");
}
