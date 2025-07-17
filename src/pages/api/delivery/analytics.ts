import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

interface DeliveryAnalytics {
  summary: {
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    avgDeliveryTime: number
    onTimeDeliveryRate: number
    customerSatisfaction: number
    totalDistance: number
    fuelEfficiency: number
  }
  driverPerformance: Array<{
    driverId: string
    driverName: string
    metrics: {
      deliveries: number
      successRate: number
      avgDeliveryTime: number
      customerRating: number
      distanceCovered: number
      hoursWorked: number
      efficiency: number
    }
    trends: {
      deliveryTrend: 'improving' | 'stable' | 'declining'
      timeManagement: 'excellent' | 'good' | 'needs_improvement'
      customerSatisfaction: 'high' | 'medium' | 'low'
    }
  }>
  routeAnalytics: {
    avgRoutesPerDay: number
    avgStopsPerRoute: number
    routeOptimizationScore: number
    mostEfficientRoutes: Array<{
      routeId: string
      efficiency: number
      distance: number
      duration: number
      stopsCount: number
    }>
    routesByZone: Array<{
      zone: string
      deliveries: number
      avgTime: number
      successRate: number
    }>
  }
  timeAnalysis: {
    peakHours: Array<{
      hour: number
      deliveries: number
      avgTime: number
    }>
    dailyPattern: Array<{
      date: string
      deliveries: number
      avgTime: number
      efficiency: number
    }>
    weeklyTrends: Array<{
      dayOfWeek: string
      deliveries: number
      avgTime: number
      satisfaction: number
    }>
  }
  costAnalysis: {
    totalFuelCost: number
    avgCostPerDelivery: number
    costByVehicleType: Array<{
      vehicleType: string
      totalCost: number
      avgCostPerKm: number
      deliveries: number
    }>
    costTrends: Array<{
      period: string
      cost: number
      deliveries: number
      efficiency: number
    }>
  }
  predictiveInsights: {
    demandForecast: Array<{
      date: string
      predictedDeliveries: number
      recommendedDrivers: number
      confidence: number
    }>
    optimizationRecommendations: Array<{
      type: 'driver_allocation' | 'route_optimization' | 'zone_adjustment' | 'time_management'
      priority: 'high' | 'medium' | 'low'
      title: string
      description: string
      expectedImprovement: string
      implementationEffort: 'low' | 'medium' | 'high'
    }>
  }
}

// Mock data generators
function generateDriverPerformance(driverCount: number = 5) {
  const drivers = [
    'Marko Petrović', 'Ana Jovanović', 'Stefan Nikolić', 
    'Milica Stojanović', 'Jovana Đorđević'
  ]
  
  return drivers.slice(0, driverCount).map((name, index) => {
    const deliveries = 80 + Math.floor(Math.random() * 120) // 80-200 deliveries
    const successRate = 92 + Math.random() * 8 // 92-100%
    const avgDeliveryTime = 18 + Math.random() * 12 // 18-30 minutes
    const customerRating = 4.2 + Math.random() * 0.8 // 4.2-5.0
    const distanceCovered = 1200 + Math.random() * 800 // 1200-2000 km
    const hoursWorked = 160 + Math.random() * 40 // 160-200 hours
    
    return {
      driverId: `driver_${index + 1}`,
      driverName: name,
      metrics: {
        deliveries,
        successRate: Math.round(successRate * 10) / 10,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        customerRating: Math.round(customerRating * 10) / 10,
        distanceCovered: Math.round(distanceCovered),
        hoursWorked: Math.round(hoursWorked),
        efficiency: Math.round((deliveries / hoursWorked) * 10) / 10
      },
      trends: {
        deliveryTrend: successRate > 97 ? 'improving' as const : 
                     successRate > 94 ? 'stable' as const : 'declining' as const,
        timeManagement: avgDeliveryTime < 22 ? 'excellent' as const :
                       avgDeliveryTime < 26 ? 'good' as const : 'needs_improvement' as const,
        customerSatisfaction: customerRating > 4.7 ? 'high' as const :
                             customerRating > 4.3 ? 'medium' as const : 'low' as const
      }
    }
  })
}

function generateRouteAnalytics() {
  const zones = ['Center', 'New Belgrade', 'Zemun', 'Voždovac', 'Novi Sad']
  
  return {
    avgRoutesPerDay: 45 + Math.random() * 20, // 45-65 routes per day
    avgStopsPerRoute: 3.2 + Math.random() * 1.8, // 3.2-5 stops per route
    routeOptimizationScore: 82 + Math.random() * 15, // 82-97%
    mostEfficientRoutes: Array.from({ length: 5 }, (_, i) => ({
      routeId: `route_efficient_${i + 1}`,
      efficiency: 90 + Math.random() * 10,
      distance: 15 + Math.random() * 25, // 15-40 km
      duration: 45 + Math.random() * 30, // 45-75 minutes
      stopsCount: 3 + Math.floor(Math.random() * 4) // 3-6 stops
    })),
    routesByZone: zones.map(zone => ({
      zone,
      deliveries: 120 + Math.floor(Math.random() * 80), // 120-200 deliveries
      avgTime: 22 + Math.random() * 8, // 22-30 minutes
      successRate: 94 + Math.random() * 6 // 94-100%
    }))
  }
}

function generateTimeAnalysis() {
  const now = new Date()
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  return {
    peakHours: Array.from({ length: 24 }, (_, hour) => {
      let deliveries = 5 + Math.random() * 15 // Base 5-20
      
      // Peak hours simulation
      if (hour >= 11 && hour <= 14) deliveries *= 2.5 // Lunch peak
      if (hour >= 18 && hour <= 21) deliveries *= 3 // Dinner peak
      if (hour < 9 || hour > 23) deliveries *= 0.2 // Low activity
      
      return {
        hour,
        deliveries: Math.round(deliveries),
        avgTime: 20 + Math.random() * 10 + (hour >= 17 && hour <= 20 ? 5 : 0) // Traffic impact
      }
    }),
    dailyPattern: Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const baseDeliveries = isWeekend ? 80 : 120
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        deliveries: baseDeliveries + Math.floor(Math.random() * 40),
        avgTime: 22 + Math.random() * 8,
        efficiency: 75 + Math.random() * 20
      }
    }),
    weeklyTrends: daysOfWeek.map(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday'
      return {
        dayOfWeek: day,
        deliveries: isWeekend ? 90 + Math.random() * 30 : 140 + Math.random() * 40,
        avgTime: 22 + Math.random() * 8,
        satisfaction: 4.3 + Math.random() * 0.6
      }
    })
  }
}

function generateCostAnalysis() {
  const vehicleTypes = ['Bike', 'Scooter', 'Car']
  const now = new Date()
  
  return {
    totalFuelCost: 2500 + Math.random() * 1000, // €2500-3500
    avgCostPerDelivery: 1.2 + Math.random() * 0.8, // €1.2-2.0
    costByVehicleType: vehicleTypes.map(type => {
      const baseCost = type === 'Car' ? 0.15 : type === 'Scooter' ? 0.08 : 0.02
      return {
        vehicleType: type,
        totalCost: 500 + Math.random() * 800,
        avgCostPerKm: baseCost + Math.random() * 0.05,
        deliveries: 200 + Math.floor(Math.random() * 150)
      }
    }),
    costTrends: Array.from({ length: 12 }, (_, i) => {
      const date = subDays(now, (11 - i) * 30) // Monthly data
      return {
        period: format(date, 'MMM yyyy'),
        cost: 2200 + Math.random() * 600,
        deliveries: 1800 + Math.floor(Math.random() * 400),
        efficiency: 75 + Math.random() * 20
      }
    })
  }
}

function generatePredictiveInsights() {
  const now = new Date()
  
  return {
    demandForecast: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        predictedDeliveries: isWeekend ? 90 + Math.random() * 30 : 130 + Math.random() * 40,
        recommendedDrivers: Math.ceil((isWeekend ? 4 : 6) + Math.random() * 2),
        confidence: 75 + Math.random() * 20
      }
    }),
    optimizationRecommendations: [
      {
        type: 'route_optimization' as const,
        priority: 'high' as const,
        title: 'Optimize Peak Hour Routes',
        description: 'Dinner rush routes (6-9 PM) show 15% efficiency loss. Implement dynamic re-routing.',
        expectedImprovement: '12-18% faster deliveries',
        implementationEffort: 'medium' as const
      },
      {
        type: 'driver_allocation' as const,
        priority: 'medium' as const,
        title: 'Weekend Staffing Adjustment',
        description: 'Weekend demand shows 25% increase but driver availability drops 30%.',
        expectedImprovement: '20% better weekend coverage',
        implementationEffort: 'low' as const
      },
      {
        type: 'zone_adjustment' as const,
        priority: 'medium' as const,
        title: 'New Belgrade Zone Expansion',
        description: 'High demand area with longest delivery times. Consider opening micro-hub.',
        expectedImprovement: '30% faster deliveries in zone',
        implementationEffort: 'high' as const
      },
      {
        type: 'time_management' as const,
        priority: 'low' as const,
        title: 'Driver Break Optimization',
        description: 'Stagger break times during lunch peak to maintain service levels.',
        expectedImprovement: '10% better lunch hour coverage',
        implementationEffort: 'low' as const
      }
    ]
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

    const { 
      period = 'month',
      storeId,
      driverId,
      includeDriverPerformance = 'true',
      includeRouteAnalytics = 'true',
      includePredictive = 'true'
    } = req.query

    // Calculate date range
    const endDate = new Date()
    const startDate = period === 'year' ? subDays(endDate, 365) : 
                    period === 'month' ? subDays(endDate, 30) : 
                    subDays(endDate, 7)

    // Generate comprehensive analytics
    const driverPerformance = includeDriverPerformance === 'true' ? 
      generateDriverPerformance() : []
    
    const routeAnalytics = includeRouteAnalytics === 'true' ? 
      generateRouteAnalytics() : null
    
    const timeAnalysis = generateTimeAnalysis()
    const costAnalysis = generateCostAnalysis()
    const predictiveInsights = includePredictive === 'true' ? 
      generatePredictiveInsights() : null

    // Calculate summary metrics
    const totalDeliveries = driverPerformance.reduce((sum, driver) => sum + driver.metrics.deliveries, 0)
    const avgSuccessRate = driverPerformance.length > 0 ? 
      driverPerformance.reduce((sum, driver) => sum + driver.metrics.successRate, 0) / driverPerformance.length : 0
    const avgDeliveryTime = driverPerformance.length > 0 ?
      driverPerformance.reduce((sum, driver) => sum + driver.metrics.avgDeliveryTime, 0) / driverPerformance.length : 0
    const avgCustomerRating = driverPerformance.length > 0 ?
      driverPerformance.reduce((sum, driver) => sum + driver.metrics.customerRating, 0) / driverPerformance.length : 0
    const totalDistance = driverPerformance.reduce((sum, driver) => sum + driver.metrics.distanceCovered, 0)

    const analytics: DeliveryAnalytics = {
      summary: {
        totalDeliveries,
        successfulDeliveries: Math.round(totalDeliveries * (avgSuccessRate / 100)),
        failedDeliveries: Math.round(totalDeliveries * (1 - avgSuccessRate / 100)),
        avgDeliveryTime: Math.round(avgDeliveryTime),
        onTimeDeliveryRate: avgSuccessRate,
        customerSatisfaction: Math.round(avgCustomerRating * 10) / 10,
        totalDistance,
        fuelEfficiency: totalDistance > 0 ? Math.round((totalDeliveries / totalDistance) * 100) / 100 : 0
      },
      driverPerformance,
      routeAnalytics: routeAnalytics!,
      timeAnalysis,
      costAnalysis,
      predictiveInsights: predictiveInsights!
    }

    // Filter by specific driver if requested
    if (driverId && driverId !== 'all') {
      analytics.driverPerformance = analytics.driverPerformance.filter(
        driver => driver.driverId === driverId
      )
    }

    res.status(200).json({
      analytics,
      metadata: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        storeId: storeId || 'all',
        lastUpdated: new Date().toISOString(),
        dataPoints: {
          drivers: analytics.driverPerformance.length,
          routes: analytics.routeAnalytics?.mostEfficientRoutes?.length || 0,
          timeSlots: analytics.timeAnalysis.peakHours.length
        }
      }
    })

  } catch (error) {
    console.error('Delivery analytics error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch delivery analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 
