import { z } from "zod";

const emailSchema = z.string().trim().email().max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6),
  next: z.string().optional(),
});

export const signupSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  department: z.string().trim().min(1).max(80),
  student_type: z.enum(["hostel", "commuter"]),
  email: emailSchema,
  password: z.string().min(6),
});

export const logoutSchema = z.object({}).passthrough();

export const authCallbackSchema = z.object({
  code: z.string().min(1),
  next: z.string().optional(),
});

export const joinDealSchema = z.object({
  deal_slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  qty: z.coerce.number().int().min(1).max(10),
  points_redeemed: z.coerce.number().int().min(0).multipleOf(100),
  payment_method: z.enum(["cash_at_pickup", "wallet"]),
  wallet_reference: z.string().trim().max(120).optional(),
});

export const cancelJoinSchema = z.object({
  deal_slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  join_id: z.string().uuid(),
});

export const dealIdSchema = z.object({ deal_id: z.string().uuid() });

export const collectJoinSchema = z.object({
  deal_id: z.string().uuid(),
  join_id: z.string().uuid(),
  signature: z.string().regex(/^[0-9a-f]{16}$/i),
});

export function safeReturnPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
