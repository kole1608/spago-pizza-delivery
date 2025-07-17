import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

interface CreatePaymentIntentRequest {
  amount: number // in cents
  currency: string
  orderId: string
  customerInfo: {
    name: string
    email: string
    phone?: string
  }
  setupFutureUsage?: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { 
      amount, 
      currency, 
      orderId, 
      customerInfo, 
      setupFutureUsage 
    } = req.body as CreatePaymentIntentRequest

    // Validate request
    if (!amount || !currency || !orderId || !customerInfo) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (amount < 50) { // Minimum 0.50 EUR
      return res.status(400).json({ error: 'Amount too small' })
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined

    // Check if customer already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: customerInfo.email },
      select: { stripeCustomerId: true }
    })

    if (existingUser?.stripeCustomerId) {
      stripeCustomerId = existingUser.stripeCustomerId
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone,
        metadata: {
          orderId,
          userId: session.user.id || '',
        }
      })

      stripeCustomerId = customer.id

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { email: customerInfo.email },
        data: { stripeCustomerId }
      })
    }

    // Calculate application fee (2.5% + 0.30 EUR)
    const applicationFeeAmount = Math.round(amount * 0.025 + 30)

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      customer: stripeCustomerId,
      setup_future_usage: setupFutureUsage ? 'off_session' : undefined,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        userId: session.user.id || '',
      },
      description: `Spago Pizza Order #${orderId}`,
      receipt_email: customerInfo.email,
      shipping: customerInfo.phone ? {
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: {
          line1: 'Customer address will be added',
          city: 'Belgrade',
          country: 'RS',
        }
      } : undefined,
    })

    // Store payment intent in database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'PENDING',
      }
    })

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: stripeCustomerId,
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: error.message,
        type: error.type,
        code: error.code,
      })
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 
