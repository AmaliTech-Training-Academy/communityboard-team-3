import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Your email is incorrect'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
