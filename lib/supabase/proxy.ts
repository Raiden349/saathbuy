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

function forwardHeaders(response: NextResponse, requestHeaders: Headers) {
  const forwarded = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.getAll().forEach((cookie) => forwarded.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header);
    if (value) forwarded.headers.set(header, value);
  }
  return forwarded;
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isProtected = isStudentPath(pathname) || isAdminPath(pathname);
  const forwardedHeaders = new Headers(request.headers);
  for (const header of ["x-saathbuy-user-id", "x-saathbuy-user-email", "x-saathbuy-user-name"]) forwardedHeaders.delete(header);
  let response = NextResponse.next({ request: { headers: forwardedHeaders } });

  if (!url || !anonKey) {
    if (!isProtected) return response;
    const loginUrl = new URL("/login?issue=configuration", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const hasAuthCookie = request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  if (!isProtected && !hasAuthCookie) return response;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const refreshedCookieHeader = request.headers.get("cookie");
        if (refreshedCookieHeader) forwardedHeaders.set("cookie", refreshedCookieHeader);
        else forwardedHeaders.delete("cookie");
        response = NextResponse.next({ request: { headers: forwardedHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = !error ? data?.claims : undefined;
  const userId = typeof claims?.sub === "string" ? claims.sub : undefined;

  if (claims && userId) {
    forwardedHeaders.set("x-saathbuy-user-id", userId);
    const email = claims.email;
    if (typeof email === "string" && email.length <= 320) forwardedHeaders.set("x-saathbuy-user-email", email);
    const metadata = claims.user_metadata;
    if (metadata && typeof metadata === "object" && "full_name" in metadata && typeof metadata.full_name === "string" && metadata.full_name.length <= 120) {
      forwardedHeaders.set("x-saathbuy-user-name", metadata.full_name);
    }
    response = forwardHeaders(response, forwardedHeaders);
  }

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
