import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Full name is required'),
    email: z.email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Minimum of 8 characters')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Include at least one special character',
      ),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;
