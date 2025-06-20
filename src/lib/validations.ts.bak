
// src/lib/validations.ts
import { z } from 'zod'

export const ClientRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  idNumber: z.string().min(5, 'Please enter a valid ID number'),
  panelInterest: z.boolean().optional(),
  panelType: z.string().optional(),
  interestLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
})

export const AdminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const ClientVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().optional()
})

export type ClientRegistrationData = z.infer<typeof ClientRegistrationSchema>
export type AdminLoginData = z.infer<typeof AdminLoginSchema>
export type ClientVerificationData = z.infer<typeof ClientVerificationSchema>