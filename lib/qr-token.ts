import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const joinIdSchema = z.string().uuid();

export function createPickupQr(joinId: string) {
  const parsedId = joinIdSchema.safeParse(joinId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.QR_SECRET;
  if (!parsedId.success || !siteUrl || !secret) return null;

  const signature = createHmac("sha256", secret).update(parsedId.data).digest("hex").slice(0, 16);
  const url = new URL("/admin/scan", siteUrl);
  url.searchParams.set("join_id", parsedId.data);
  url.searchParams.set("sig", signature);
  return { text: url.toString(), shortCode: parsedId.data.slice(0, 8), signature };
}

export function verifyPickupQr(joinId: string, signature: string) {
  const parsedId = joinIdSchema.safeParse(joinId);
  const secret = process.env.QR_SECRET;
  if (!parsedId.success || !secret || !/^[0-9a-f]{16}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(parsedId.data).digest().subarray(0, 8);
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

export function parsePickupQrInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const joinId = url.searchParams.get("join_id") ?? url.searchParams.get("join") ?? "";
    const signature = url.searchParams.get("sig") ?? "";
    return joinIdSchema.safeParse(joinId).success && /^[0-9a-f]{16}$/i.test(signature)
      ? { joinId, signature }
      : null;
  } catch {
    const match = trimmed.match(/^([0-9a-f-]{36})[.\s]+([0-9a-f]{16})$/i);
    if (!match || !joinIdSchema.safeParse(match[1]).success) return null;
    return { joinId: match[1], signature: match[2] };
  }
}
