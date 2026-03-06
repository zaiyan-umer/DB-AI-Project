import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must be less than 50 characters"),
})

export type LoginFormData = z.infer<typeof loginSchema>;
