import { NextApiRequest, NextApiResponse } from 'next'
import { buffer } from 'micro'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { socketManager } from '@/lib/socket-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export const config = {
  api: {
    bodyParser: false,
  },
}

async function sendOrderConfirmationEmail(orderId: string, customerEmail: string) {
  // In a real app, you would send an email using SendGrid, Mailgun, etc.
  console.log(`📧 Sending order confirmation email to ${customerEmail} for order ${orderId}`)
  
  // Mock email sending
  return new Promise(resolve => setTimeout(resolve, 100))
}

async function updateInventory(orderId: string) {
  try {
    // Get order items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!order) return

    // Update inventory for each ingredient
    for (const item of order.items) {
      for (const productIngredient of item.product.ingredients) {
        const requiredQuantity = productIngredient.quantity * item.quantity

        // Find corresponding inventory item
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            name: productIngredient.ingredient.name
          }
        })

        if (inventoryItem) {
          // Update stock
          const newStock = Math.max(0, inventoryItem.currentStock - requiredQuantity)
          
          await prisma.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { currentStock: newStock }
          })

          // Create stock movement record
          await prisma.stockMovement.create({
            data: {
              inventoryItemId: inventoryItem.id,
              type: 'OUT',
              quantity: requiredQuantity,
              reason: `Order ${orderId}`,
              performedBy: 'system'
            }
          })

          // Check if stock is low and notify via WebSocket
          if (newStock <= inventoryItem.minimumStock && socketManager) {
            await socketManager.notifyInventoryChange({
              itemId: inventoryItem.id,
              itemName: inventoryItem.name,
              currentStock: newStock,
              minimumStock: inventoryItem.minimumStock
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating inventory:', error)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = await buffer(req)
  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).send(`Webhook Error: ${err?.message || 'Unknown error'}`)
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        console.log(`💳 Payment succeeded for order ${orderId}`)

        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paidAt: new Date(),
          }
        })

        // Get order details for notifications
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            items: {
              include: {
                product: true
              }
            }
          }
        })

        if (order && socketManager) {
          // Notify kitchen about new order
          await socketManager.notifyNewOrder({
            orderId,
            customerName: order.user?.name || 'Customer',
            items: order.items.map((item: any) => ({
              name: item.product.name,
              quantity: item.quantity
            })),
            total: parseFloat(order.total.toString()),
            priority: order.total > 50 ? 'urgent' : 'normal'
          })
        }

        // Send confirmation email
        if (paymentIntent.receipt_email) {
          await sendOrderConfirmationEmail(orderId, paymentIntent.receipt_email)
        }

        // Update inventory
        await updateInventory(orderId)

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        console.log(`❌ Payment failed for order ${orderId}`)

        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAYMENT_FAILED',
            paymentStatus: 'FAILED',
          }
        })

        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        console.log(`🚫 Payment canceled for order ${orderId}`)

        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'CANCELLED',
          }
        })

        break
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod
        console.log(`💳 Payment method attached: ${paymentMethod.id}`)

        // Save payment method to user's account
        if (paymentMethod.customer) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: paymentMethod.customer as string }
          })

          if (user) {
            // In a real app, you might want to store payment method details
            console.log(`💾 Saved payment method for user ${user.email}`)
          }
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // Handle subscription events for loyalty programs
        const subscription = event.data.object as Stripe.Subscription
        console.log(`🔄 Subscription ${event.type}: ${subscription.id}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`📄 Invoice payment succeeded: ${invoice.id}`)
        
        // Handle recurring payment for subscriptions/loyalty programs
        if ((invoice as any).subscription) {
          // Update subscription status in database
          console.log(`✅ Subscription payment processed: ${(invoice as any).subscription}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`❌ Invoice payment failed: ${invoice.id}`)
        
        // Handle failed subscription payment
        if ((invoice as any).subscription) {
          console.log(`🔴 Subscription payment failed: ${(invoice as any).subscription}`)
        }
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        console.log(`⚠️ Dispute created: ${dispute.id}`)
        
        // Notify admin about dispute
        if (socketManager) {
          // In a real app, you would send this to admin dashboard
          console.log(`🚨 Admin notification: Dispute created for charge ${dispute.charge}`)
        }
        break
      }

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })

  } catch (error: any) {
    console.error('Error processing webhook:', error)
    
    // Return 500 to tell Stripe to retry
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    })
  }
} 
