import { cache } from "react";
import { headers } from "next/headers";

/** Identity verified once by the Supabase proxy and forwarded to server components. */
export const getRequestUser = cache(async () => {
  const requestHeaders = await headers();
  const id = requestHeaders.get("x-saathbuy-user-id");
  if (!id) return null;
  return {
    id,
    email: requestHeaders.get("x-saathbuy-user-email") ?? "",
    fullName: requestHeaders.get("x-saathbuy-user-name") ?? "",
  };
});
