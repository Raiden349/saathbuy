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

export function safeReturnPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
