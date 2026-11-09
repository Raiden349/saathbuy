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

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const passwordResetCompleteSchema = z.object({
  email: emailSchema,
  token: z.string().trim().regex(/^\d{6}$/),
  password: z.string().min(6).max(128),
  confirm_password: z.string().min(6).max(128),
}).refine((data) => data.password === data.confirm_password, {
  path: ["confirm_password"],
  message: "Passwords do not match.",
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

export const requestProductSchema = z.object({
  title: z.string().trim().min(2).max(100),
  note: z.string().trim().max(500).optional(),
});

export const requestVoteSchema = z.object({ request_id: z.string().uuid() });

const optionalText = (max: number) => z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(max).optional());

export const adminDealSchema = z.object({
  deal_id: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  title: z.string().trim().min(2).max(120),
  description: optionalText(1000),
  image_url: z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional()),
  category: optionalText(40),
  retail_price: z.coerce.number().int().positive().max(1_000_000),
  max_qty_per_user: z.coerce.number().int().min(1).max(10),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  pickup_point_id: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  pickup_time: z.preprocess((value) => value === "" ? undefined : value, z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional()),
  sponsor_name: optionalText(120),
  wholesale_cost: z.coerce.number().int().positive().max(1_000_000),
  tier_count: z.coerce.number().int().min(1).max(3),
  tier_1_name: z.string().trim().min(1).max(30),
  tier_1_min_joiners: z.coerce.number().int().min(1).max(1000),
  tier_1_price: z.coerce.number().int().positive().max(1_000_000),
  tier_2_name: optionalText(30),
  tier_2_min_joiners: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(1).max(1000).optional()),
  tier_2_price: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().positive().max(1_000_000).optional()),
  tier_3_name: optionalText(30),
  tier_3_min_joiners: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(1).max(1000).optional()),
  tier_3_price: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().positive().max(1_000_000).optional()),
}).superRefine((data, ctx) => {
  const tiers = [
    { name: data.tier_1_name, min: data.tier_1_min_joiners, price: data.tier_1_price },
    { name: data.tier_2_name, min: data.tier_2_min_joiners, price: data.tier_2_price },
    { name: data.tier_3_name, min: data.tier_3_min_joiners, price: data.tier_3_price },
  ].slice(0, data.tier_count);
  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index];
    if (!tier.name || tier.min === undefined || tier.price === undefined) ctx.addIssue({ code: "custom", path: [`tier_${index + 1}_name`], message: "Complete every selected tier." });
    if (index > 0) {
      const previous = tiers[index - 1];
      if (typeof tier.min === "number" && typeof previous.min === "number" && tier.min <= previous.min) ctx.addIssue({ code: "custom", path: [`tier_${index + 1}_min_joiners`], message: "Tier thresholds must increase." });
      if (typeof tier.price === "number" && typeof previous.price === "number" && tier.price >= previous.price) ctx.addIssue({ code: "custom", path: [`tier_${index + 1}_price`], message: "Each higher tier price must be lower." });
    }
  }
});

export const manualKpiSchema = z.object({
  instagram_engagement: z.coerce.number().int().min(0).max(1_000_000_000),
  sponsor_leads: z.coerce.number().int().min(0).max(1_000_000_000),
});

export function safeReturnPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
