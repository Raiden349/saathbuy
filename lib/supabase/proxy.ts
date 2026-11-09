import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

function isStudentPath(pathname: string) {
  return pathname === "/pickup"
    || pathname.startsWith("/pickup/")
    || pathname === "/rewards"
    || pathname.startsWith("/rewards/")
    || pathname === "/request"
    || pathname.startsWith("/request/")
    || /^\/deals\/[^/]+\/join\/?$/.test(pathname);
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function redirectWithSession(response: NextResponse, destination: URL) {
  const redirectResponse = NextResponse.redirect(destination);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isProtected = isStudentPath(pathname) || isAdminPath(pathname);
  let response = NextResponse.next({ request });

  if (!url || !anonKey) {
    if (!isProtected) return response;
    const loginUrl = new URL("/login?issue=configuration", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const userId = !error && typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;

  if (isProtected && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return redirectWithSession(response, loginUrl);
  }

  if (isAdminPath(pathname) && userId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile?.is_admin) {
      return redirectWithSession(response, new URL("/", request.url));
    }
  }

  return response;
}
