import { NextResponse, type NextRequest } from "next/server";
import { authCallbackSchema, safeReturnPath } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = authCallbackSchema.safeParse({
    code: url.searchParams.get("code"),
    next: url.searchParams.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login?issue=confirmation", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(parsed.data.code);
  if (error) return NextResponse.redirect(new URL("/login?issue=confirmation", url.origin));

  return NextResponse.redirect(new URL(safeReturnPath(parsed.data.next), url.origin));
}
