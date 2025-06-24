// src/lib/stripe.ts - Create a centralized Stripe configuration
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil', // Use latest stable version instead of beta
  typescript: true,
})