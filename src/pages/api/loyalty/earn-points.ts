import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface LoyaltyResponse {
  success: boolean
  points?: number
  tier?: string
  message?: string
  achievements?: Array<{
    id: string
    name: string
    description: string
    points: number
    unlockedAt: string
  }>
}

// Temporarily commented out - requires Prisma model updates
/*
async function createLoyaltyTransaction(
  userId: string,
  points: number,
  type: string,
  reason: string,
  referenceId?: string
) {
  return await prisma.loyaltyTransaction.create({
    data: {
      userId,
      points,
      type,
      reason,
      referenceId,
      createdAt: new Date()
    }
  })
}

async function calculateUserPoints(userId: string) {
  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { userId }
  })

  const earned = transactions
    .filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + t.points, 0)

  const redeemed = transactions
    .filter(t => t.type === 'redeemed')
    .reduce((sum, t) => sum + t.points, 0)

  return earned - redeemed
}

async function updateUserLoyalty(userId: string, additionalPoints: number, orderTotal?: number) {
  const currentPoints = await calculateUserPoints(userId)
  const totalPoints = currentPoints + additionalPoints

  await prisma.userLoyalty.upsert({
    where: { userId },
    update: {
      points: totalPoints,
      totalSpent: orderTotal ? { increment: orderTotal } : undefined,
      totalOrders: { increment: 1 },
      lastActivity: new Date(),
      tier: determineTier(totalPoints)
    },
    create: {
      userId,
      points: totalPoints,
      totalSpent: orderTotal || 0,
      totalOrders: 1,
      tier: determineTier(totalPoints)
    }
  })

  return { points: totalPoints, tier: determineTier(totalPoints) }
}

async function checkAchievements(userId: string) {
  const achievements = []

  // Check various achievements
  const userStats = await prisma.userLoyalty.findUnique({
    where: { userId }
  })

  if (!userStats) return achievements

  const achievementChecks = [
    { id: 'first_order', condition: userStats.totalOrders >= 1, name: 'First Order', description: 'Complete your first order', points: 50 },
    { id: 'loyal_customer', condition: userStats.totalOrders >= 5, name: 'Loyal Customer', description: 'Complete 5 orders', points: 100 },
    { id: 'pizza_lover', condition: userStats.totalOrders >= 10, name: 'Pizza Lover', description: 'Complete 10 orders', points: 200 },
    { id: 'big_spender', condition: userStats.totalSpent >= 100, name: 'Big Spender', description: 'Spend $100 total', points: 150 },
    { id: 'vip_customer', condition: userStats.totalSpent >= 500, name: 'VIP Customer', description: 'Spend $500 total', points: 500 },
  ]

  for (const check of achievementChecks) {
    if (check.condition) {
      const existingAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: check.id
        }
      })

      if (!existingAchievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: check.id,
            unlockedAt: new Date()
          }
        })

        achievements.push({
          id: check.id,
          name: check.name,
          description: check.description,
          points: check.points,
          unlockedAt: new Date().toISOString()
        })
      }
    }
  }

  // Check birthday bonus
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (user?.createdAt) {
    const today = new Date()
    const birthday = new Date(user.createdAt)
    
    if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
      const birthdayAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: `birthday_${today.getFullYear()}`
        }
      })

      if (!birthdayAchievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: `birthday_${today.getFullYear()}`,
            unlockedAt: new Date()
          }
        })

        achievements.push({
          id: `birthday_${today.getFullYear()}`,
          name: 'Birthday Bonus',
          description: 'Happy Birthday! Enjoy your special day.',
          points: 200,
          unlockedAt: new Date().toISOString()
        })
      }
    }
  }

  return achievements
}
*/

function determineTier(points: number): string {
  if (points >= 2000) return 'platinum'
  if (points >= 1000) return 'gold'
  if (points >= 500) return 'silver'
  return 'bronze'
}

function calculateOrderPoints(orderTotal: number, tier: string): number {
  const basePoints = Math.floor(orderTotal) // 1 point per dollar
  const multiplier = getTierMultiplier(tier)
  return Math.floor(basePoints * multiplier)
}

function getTierMultiplier(tier: string): number {
  switch (tier) {
    case 'platinum': return 2.0
    case 'gold': return 1.5
    case 'silver': return 1.25
    case 'bronze':
    default: return 1.0
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LoyaltyResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { orderId, orderTotal, action = 'earn' } = req.body

    if (!orderId || !orderTotal) {
      return res.status(400).json({ success: false, message: 'Order ID and total are required' })
    }

    // Temporarily simplified response until Prisma models are added
    if (action === 'earn') {
      // const currentLoyalty = await prisma.userLoyalty.findUnique({
      //   where: { userId: session.user.id }
      // })

      // Mock tier for now
      const mockTier = 'bronze'
      const pointsEarned = calculateOrderPoints(orderTotal, mockTier)

      // Check for duplicate transactions
      // const existingTransaction = await prisma.loyaltyTransaction.findFirst({
      //   where: {
      //     userId: session.user.id,
      //     referenceId: orderId,
      //     type: 'earned'
      //   }
      // })

      // if (existingTransaction) {
      //   return res.status(400).json({ 
      //     success: false, 
      //     message: 'Points already earned for this order' 
      //   })
      // }

      // const transaction = await createLoyaltyTransaction(
      //   session.user.id,
      //   pointsEarned,
      //   'earned',
      //   `Points earned from order ${orderId}`,
      //   orderId
      // )

      // const { points: finalPoints, tier } = await updateUserLoyalty(
      //   session.user.id,
      //   pointsEarned,
      //   orderTotal
      // )

      // const achievements = await checkAchievements(session.user.id)

      // Mock response until models are implemented
      const finalPoints = pointsEarned
      const tier = mockTier

      return res.status(200).json({
        success: true,
        points: finalPoints,
        tier,
        message: `Earned ${pointsEarned} points! You now have ${finalPoints} total points.`,
        achievements: [] // Mock empty achievements for now
      })
    }

    return res.status(400).json({ success: false, message: 'Invalid action' })

  } catch (error) {
    console.error('Loyalty points error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Failed to process loyalty points',
    })
  }
} 
