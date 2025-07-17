import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, format } from 'date-fns'

interface InventoryMetrics {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalValue: number
  turnoverRate: number
  wastePercentage: number
  topSellingIngredients: Array<{
    id: string
    name: string
    usage: number
    revenue: number
    efficiency: number
  }>
  stockLevels: Array<{
    id: string
    name: string
    currentStock: number
    minimumStock: number
    maximumStock: number
    reorderPoint: number
    status: 'healthy' | 'low' | 'critical' | 'overstock'
    daysRemaining: number
    cost: number
  }>
  wasteAnalysis: Array<{
    date: string
    itemName: string
    quantity: number
    cost: number
    reason: string
  }>
  demandForecast: Array<{
    itemId: string
    itemName: string
    currentStock: number
    predictedDemand7d: number
    predictedDemand30d: number
    recommendedOrder: number
    confidence: number
  }>
  supplierPerformance: Array<{
    supplierId: string
    supplierName: string
    deliveryTime: number
    qualityScore: number
    priceCompetitiveness: number
    reliability: number
    totalOrders: number
  }>
  costAnalysis: {
    totalCostOfGoods: number
    averageCostPerOrder: number
    ingredientCostBreakdown: Array<{
      category: string
      cost: number
      percentage: number
    }>
    monthlyTrends: Array<{
      month: string
      cost: number
      orders: number
      efficiency: number
    }>
  }
  abc_analysis: {
    categoryA: { items: number; value: number; percentage: number }
    categoryB: { items: number; value: number; percentage: number }
    categoryC: { items: number; value: number; percentage: number }
  }
}

function calculateABCAnalysis(items: any[]) {
  // Sort by value (usage * cost)
  const sortedItems = items
    .map(item => ({
      ...item,
      value: item.usage * item.cost
    }))
    .sort((a, b) => b.value - a.value)

  const totalValue = sortedItems.reduce((sum, item) => sum + item.value, 0)
  
  let cumulativeValue = 0
  let categoryA = { items: 0, value: 0, percentage: 0 }
  let categoryB = { items: 0, value: 0, percentage: 0 }
  let categoryC = { items: 0, value: 0, percentage: 0 }

  sortedItems.forEach(item => {
    cumulativeValue += item.value
    const cumulativePercentage = (cumulativeValue / totalValue) * 100

    if (cumulativePercentage <= 80) {
      categoryA.items++
      categoryA.value += item.value
    } else if (cumulativePercentage <= 95) {
      categoryB.items++
      categoryB.value += item.value
    } else {
      categoryC.items++
      categoryC.value += item.value
    }
  })

  categoryA.percentage = totalValue > 0 ? (categoryA.value / totalValue) * 100 : 0
  categoryB.percentage = totalValue > 0 ? (categoryB.value / totalValue) * 100 : 0
  categoryC.percentage = totalValue > 0 ? (categoryC.value / totalValue) * 100 : 0

  return { categoryA, categoryB, categoryC }
}

async function predictDemand(itemId: string, historicalUsage: any[]) {
  if (historicalUsage.length < 7) {
    return {
      predicted7d: 0,
      predicted30d: 0,
      confidence: 0
    }
  }

  // Simple moving average with trend
  const recent7Days = historicalUsage.slice(-7)
  const recent30Days = historicalUsage.slice(-30)
  
  const avg7d = recent7Days.reduce((sum, day) => sum + day.usage, 0) / 7
  const avg30d = recent30Days.reduce((sum, day) => sum + day.usage, 0) / Math.min(30, recent30Days.length)
  
  // Calculate trend
  const trend = recent7Days.length >= 2 ? 
    (recent7Days[recent7Days.length - 1].usage - recent7Days[0].usage) / 7 : 0

  const predicted7d = Math.max(0, avg7d * 7 + trend * 7)
  const predicted30d = Math.max(0, avg30d * 30 + trend * 30)
  
  // Confidence based on data consistency
  const variance = recent7Days.reduce((sum, day) => sum + Math.pow(day.usage - avg7d, 2), 0) / 7
  const confidence = Math.max(0.5, Math.min(1, 1 - (variance / avg7d)))

  return {
    predicted7d: Math.round(predicted7d),
    predicted30d: Math.round(predicted30d),
    confidence: Math.round(confidence * 100)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { storeId, period = 'month' } = req.query

    const endDate = new Date()
    const startDate = period === 'year' ? subDays(endDate, 365) : 
                    period === 'month' ? subDays(endDate, 30) : 
                    subDays(endDate, 7)

    // Get inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        stockMovements: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter(item => 
      item.currentStock <= item.minimumStock && item.currentStock > 0
    ).length
    const outOfStockItems = inventoryItems.filter(item => 
      item.currentStock === 0
    ).length

    // Calculate total value
    const totalValue = inventoryItems.reduce((sum, item) => 
      sum + (item.currentStock * item.costPerUnit), 0
    )

    // Top selling ingredients (based on usage)
    const topSellingIngredients = await Promise.all(
      inventoryItems.map(async item => {
        const usage = item.stockMovements
          .filter(movement => movement.type === 'out')
          .reduce((sum, movement) => sum + movement.quantity, 0)

        const revenue = usage * item.costPerUnit * 2.5 // Estimate revenue multiplier
        const efficiency = item.currentStock > 0 ? usage / item.currentStock : 0

        return {
          id: item.id,
          name: item.name,
          usage,
          revenue,
          efficiency
        }
      })
    )

    // Stock levels with analysis
    const stockLevels = inventoryItems.map(item => {
      const usage = item.stockMovements
        .filter(movement => movement.type === 'out')
        .reduce((sum, movement) => sum + movement.quantity, 0)

      const dailyUsage = usage / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = dailyUsage > 0 ? Math.round(item.currentStock / dailyUsage) : 999

      let status: 'healthy' | 'low' | 'critical' | 'overstock' = 'healthy'
      if (item.currentStock === 0) status = 'critical'
      else if (item.currentStock <= item.minimumStock) status = 'low'
      else if (item.currentStock > item.minimumStock * 3) status = 'overstock'

      return {
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        maximumStock: item.minimumStock * 4, // Estimated max stock
        reorderPoint: Math.round(item.minimumStock * 1.5),
        status,
        daysRemaining: Math.min(daysRemaining, 999),
        cost: item.costPerUnit
      }
    })

    // Waste analysis (simulated data)
    const wasteAnalysis = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      if (Math.random() > 0.7) { // 30% chance of waste each day
        const randomItem = inventoryItems[Math.floor(Math.random() * inventoryItems.length)]
        const wasteQuantity = Math.round(Math.random() * 5 + 1)
        
        wasteAnalysis.push({
          date: format(date, 'yyyy-MM-dd'),
          itemName: randomItem.name,
          quantity: wasteQuantity,
          cost: wasteQuantity * randomItem.costPerUnit,
          reason: ['Expired', 'Damaged', 'Overproduction', 'Quality Issues'][Math.floor(Math.random() * 4)]
        })
      }
    }

    // Demand forecast
    const demandForecast = await Promise.all(
      inventoryItems.slice(0, 10).map(async item => { // Limit for performance
        const historicalUsage = Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
          usage: Math.round(Math.random() * 10 + 1) // Mock historical usage
        }))

        const forecast = await predictDemand(item.id, historicalUsage)
        const recommendedOrder = Math.max(0, forecast.predicted30d - item.currentStock)

        return {
          itemId: item.id,
          itemName: item.name,
          currentStock: item.currentStock,
          predictedDemand7d: forecast.predicted7d,
          predictedDemand30d: forecast.predicted30d,
          recommendedOrder,
          confidence: forecast.confidence
        }
      })
    )

    // Supplier performance (mock data)
    const supplierPerformance = [
      {
        supplierId: 'sup_001',
        supplierName: 'Fresh Produce Co',
        deliveryTime: 2.5,
        qualityScore: 94,
        priceCompetitiveness: 87,
        reliability: 96,
        totalOrders: 45
      },
      {
        supplierId: 'sup_002',
        supplierName: 'Metro Wholesale',
        deliveryTime: 1.8,
        qualityScore: 89,
        priceCompetitiveness: 92,
        reliability: 91,
        totalOrders: 38
      },
      {
        supplierId: 'sup_003',
        supplierName: 'Quality Foods Ltd',
        deliveryTime: 3.2,
        qualityScore: 97,
        priceCompetitiveness: 78,
        reliability: 98,
        totalOrders: 28
      }
    ]

    // Cost analysis
    const totalWasteValue = wasteAnalysis.reduce((sum, waste) => sum + waste.cost, 0)
    const wastePercentage = totalValue > 0 ? (totalWasteValue / totalValue) * 100 : 0

    const costAnalysis = {
      totalCostOfGoods: totalValue,
      averageCostPerOrder: totalValue / Math.max(1, inventoryItems.length),
      ingredientCostBreakdown: [
        { category: 'Dairy & Cheese', cost: totalValue * 0.35, percentage: 35 },
        { category: 'Meat & Protein', cost: totalValue * 0.25, percentage: 25 },
        { category: 'Vegetables', cost: totalValue * 0.20, percentage: 20 },
        { category: 'Flour & Dough', cost: totalValue * 0.15, percentage: 15 },
        { category: 'Spices & Seasonings', cost: totalValue * 0.05, percentage: 5 }
      ],
      monthlyTrends: Array.from({ length: 12 }, (_, i) => {
        const month = new Date()
        month.setMonth(month.getMonth() - i)
        return {
          month: format(month, 'MMM yyyy'),
          cost: totalValue * (0.8 + Math.random() * 0.4),
          orders: Math.round(50 + Math.random() * 30),
          efficiency: 75 + Math.random() * 20
        }
      }).reverse()
    }

    // ABC Analysis
    const itemsWithUsage = topSellingIngredients.map(item => ({
      ...item,
      cost: stockLevels.find(stock => stock.id === item.id)?.cost || 0
    }))
    const abcAnalysis = calculateABCAnalysis(itemsWithUsage)

    // Calculate turnover rate
    const totalUsage = topSellingIngredients.reduce((sum, item) => sum + item.usage, 0)
    const averageStock = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0) / inventoryItems.length
    const turnoverRate = averageStock > 0 ? totalUsage / averageStock : 0

    const metrics: InventoryMetrics = {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      turnoverRate,
      wastePercentage,
      topSellingIngredients: topSellingIngredients
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10),
      stockLevels,
      wasteAnalysis: wasteAnalysis.slice(0, 20),
      demandForecast,
      supplierPerformance,
      costAnalysis,
      abc_analysis: abcAnalysis
    }

    res.status(200).json({
      metrics,
      metadata: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        storeId: storeId || 'all',
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Inventory analytics error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch inventory analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 
