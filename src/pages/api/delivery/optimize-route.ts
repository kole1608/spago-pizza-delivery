import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface DeliveryStop {
  id: string
  orderId: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  customerName: string
  customerPhone: string
  estimatedDuration: number // minutes at location
  priority: 'low' | 'normal' | 'high' | 'urgent'
  timeWindow?: {
    earliest: string // ISO time
    latest: string // ISO time
  }
  specialInstructions?: string
  orderValue: number
}

interface OptimizedRoute {
  routeId: string
  driverId: string
  stops: Array<DeliveryStop & {
    sequence: number
    estimatedArrival: string
    estimatedDeparture: string
    distance: number // meters from previous stop
    duration: number // minutes from previous stop
  }>
  totalDistance: number // meters
  totalDuration: number // minutes
  totalValue: number // total order value
  efficiency: {
    score: number // 0-100
    distancePerOrder: number
    timePerOrder: number
    valuePerKm: number
  }
  routePolyline: string // encoded polyline for map display
  alternativeRoutes?: Array<{
    description: string
    distance: number
    duration: number
    score: number
  }>
}

interface Driver {
  id: string
  name: string
  phone: string
  status: 'available' | 'busy' | 'offline'
  currentLocation: {
    lat: number
    lng: number
    lastUpdated: string
  }
  vehicle: {
    type: 'bike' | 'scooter' | 'car'
    capacity: number
    fuelEfficiency: number
  }
  performance: {
    avgDeliveryTime: number
    successRate: number
    customerRating: number
    todayDeliveries: number
  }
  workingHours: {
    start: string
    end: string
  }
}

// Mock drivers data
const mockDrivers: Driver[] = [
  {
    id: 'driver_001',
    name: 'Marko Petrović',
    phone: '+381 60 123 4567',
    status: 'available',
    currentLocation: {
      lat: 44.8176,
      lng: 20.4633,
      lastUpdated: new Date().toISOString()
    },
    vehicle: {
      type: 'scooter',
      capacity: 4,
      fuelEfficiency: 2.5 // km per liter
    },
    performance: {
      avgDeliveryTime: 22,
      successRate: 98.5,
      customerRating: 4.8,
      todayDeliveries: 12
    },
    workingHours: {
      start: '10:00',
      end: '22:00'
    }
  },
  {
    id: 'driver_002',
    name: 'Ana Jovanović',
    phone: '+381 60 234 5678',
    status: 'available',
    currentLocation: {
      lat: 44.8225,
      lng: 20.4116,
      lastUpdated: new Date().toISOString()
    },
    vehicle: {
      type: 'bike',
      capacity: 2,
      fuelEfficiency: 0 // electric bike
    },
    performance: {
      avgDeliveryTime: 18,
      successRate: 99.2,
      customerRating: 4.9,
      todayDeliveries: 8
    },
    workingHours: {
      start: '11:00',
      end: '20:00'
    }
  }
]

// Store locations
const STORE_LOCATIONS = [
  { id: 'store_001', lat: 44.8176, lng: 20.4633, name: 'Belgrade Center' },
  { id: 'store_002', lat: 44.8225, lng: 20.4116, name: 'New Belgrade' },
  { id: 'store_003', lat: 44.8431, lng: 20.4138, name: 'Zemun' }
]

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateTravelTime(distance: number, vehicleType: string, trafficFactor = 1.2): number {
  // Base speeds in km/h
  const speeds = {
    bike: 15,
    scooter: 25,
    car: 30
  }
  
  const baseSpeed = speeds[vehicleType as keyof typeof speeds] || 25
  const adjustedSpeed = baseSpeed / trafficFactor
  const timeHours = (distance / 1000) / adjustedSpeed
  return Math.round(timeHours * 60) // Convert to minutes
}

function solveTSP(stops: DeliveryStop[], startLocation: { lat: number; lng: number }): number[] {
  // Simplified Traveling Salesman Problem solver using nearest neighbor heuristic
  // In production, use more sophisticated algorithms like OR-Tools
  
  const n = stops.length
  if (n === 0) return []
  if (n === 1) return [0]
  
  const visited = new Array(n).fill(false)
  const route = []
  
  // Find nearest stop to starting location
  let currentIdx = 0
  let minDist = Infinity
  for (let i = 0; i < n; i++) {
    const dist = calculateDistance(
      startLocation.lat, startLocation.lng,
      stops[i].coordinates.lat, stops[i].coordinates.lng
    )
    if (dist < minDist) {
      minDist = dist
      currentIdx = i
    }
  }
  
  route.push(currentIdx)
  visited[currentIdx] = true
  
  // Continue with nearest neighbor
  for (let i = 1; i < n; i++) {
    let nearestIdx = -1
    let nearestDist = Infinity
    
    for (let j = 0; j < n; j++) {
      if (!visited[j]) {
        const dist = calculateDistance(
          stops[currentIdx].coordinates.lat, stops[currentIdx].coordinates.lng,
          stops[j].coordinates.lat, stops[j].coordinates.lng
        )
        
        // Priority bonus (higher priority = shorter effective distance)
        const priorityBonus = stops[j].priority === 'urgent' ? 0.5 :
                             stops[j].priority === 'high' ? 0.8 :
                             stops[j].priority === 'normal' ? 1.0 : 1.2
        
        const effectiveDist = dist * priorityBonus
        
        if (effectiveDist < nearestDist) {
          nearestDist = effectiveDist
          nearestIdx = j
        }
      }
    }
    
    if (nearestIdx !== -1) {
      route.push(nearestIdx)
      visited[nearestIdx] = true
      currentIdx = nearestIdx
    }
  }
  
  return route
}

function optimizeRouteForDriver(
  driver: Driver, 
  stops: DeliveryStop[], 
  storeLocation: { lat: number; lng: number }
): OptimizedRoute {
  
  // Filter stops based on vehicle capacity and priority
  let availableStops = [...stops]
  
  // Sort by priority and time windows
  availableStops.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
    const aPriority = priorityOrder[a.priority]
    const bPriority = priorityOrder[b.priority]
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // Consider time windows
    if (a.timeWindow && b.timeWindow) {
      return new Date(a.timeWindow.latest).getTime() - new Date(b.timeWindow.latest).getTime()
    }
    
    return 0
  })
  
  // Limit by vehicle capacity
  availableStops = availableStops.slice(0, driver.vehicle.capacity)
  
  // Solve TSP for optimal route
  const route = solveTSP(availableStops, storeLocation)
  
  // Build optimized route with detailed information
  let currentLocation = storeLocation
  let currentTime = new Date()
  let totalDistance = 0
  let totalDuration = 0
  let totalValue = 0
  
  const optimizedStops = route.map((stopIdx, sequence) => {
    const stop = availableStops[stopIdx]
    const distance = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      stop.coordinates.lat, stop.coordinates.lng
    )
    
    const travelTime = calculateTravelTime(distance, driver.vehicle.type)
    const arrivalTime = new Date(currentTime.getTime() + travelTime * 60000)
    const departureTime = new Date(arrivalTime.getTime() + stop.estimatedDuration * 60000)
    
    totalDistance += distance
    totalDuration += travelTime + stop.estimatedDuration
    totalValue += stop.orderValue
    
    currentLocation = stop.coordinates
    currentTime = departureTime
    
    return {
      ...stop,
      sequence: sequence + 1,
      estimatedArrival: arrivalTime.toISOString(),
      estimatedDeparture: departureTime.toISOString(),
      distance,
      duration: travelTime
    }
  })
  
  // Calculate efficiency metrics
  const efficiency = {
    score: Math.min(100, Math.max(0, 100 - (totalDuration / availableStops.length * 2))),
    distancePerOrder: totalDistance / Math.max(1, optimizedStops.length),
    timePerOrder: totalDuration / Math.max(1, optimizedStops.length),
    valuePerKm: totalValue / Math.max(1, totalDistance / 1000)
  }
  
  // Generate mock polyline (in production, use Google Directions API)
  const routePolyline = `route_${driver.id}_${Date.now()}`
  
  return {
    routeId: `route_${driver.id}_${Date.now()}`,
    driverId: driver.id,
    stops: optimizedStops,
    totalDistance,
    totalDuration,
    totalValue,
    efficiency,
    routePolyline,
    alternativeRoutes: [
      {
        description: 'Fastest route',
        distance: totalDistance * 0.95,
        duration: totalDuration * 0.9,
        score: efficiency.score + 5
      },
      {
        description: 'Shortest distance',
        distance: totalDistance * 0.85,
        duration: totalDuration * 1.1,
        score: efficiency.score - 2
      }
    ]
  }
}

function selectBestDriver(drivers: Driver[], stops: DeliveryStop[]): Driver | null {
  const availableDrivers = drivers.filter(d => d.status === 'available')
  
  if (availableDrivers.length === 0) return null
  
  let bestDriver = availableDrivers[0]
  let bestScore = 0
  
  for (const driver of availableDrivers) {
    // Calculate score based on various factors
    const capacityScore = Math.min(100, (driver.vehicle.capacity / stops.length) * 100)
    const performanceScore = (driver.performance.successRate + driver.performance.customerRating * 20) / 2
    const workloadScore = Math.max(0, 100 - (driver.performance.todayDeliveries * 5))
    
    const totalScore = (capacityScore + performanceScore + workloadScore) / 3
    
    if (totalScore > bestScore) {
      bestScore = totalScore
      bestDriver = driver
    }
  }
  
  return bestDriver
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      stops,
      storeId,
      driverId,
      optimizationCriteria = 'balanced', // 'time', 'distance', 'balanced'
      includeAlternatives = true
    } = req.body

    // Validate request
    if (!stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ error: 'Stops array is required and must not be empty' })
    }

    // Find store location
    const store = STORE_LOCATIONS.find(s => s.id === storeId) || STORE_LOCATIONS[0]
    
    // Get available drivers
    let targetDriver: Driver | null = null
    
    if (driverId) {
      targetDriver = mockDrivers.find(d => d.id === driverId) || null
      if (!targetDriver || targetDriver.status !== 'available') {
        return res.status(400).json({ error: 'Specified driver not available' })
      }
    } else {
      targetDriver = selectBestDriver(mockDrivers, stops)
      if (!targetDriver) {
        return res.status(409).json({ error: 'No drivers available' })
      }
    }

    // Optimize route
    const optimizedRoute = optimizeRouteForDriver(targetDriver, stops, store)

    // Log route optimization
    try {
      await prisma.deliveryRoute.create({
        data: {
          id: optimizedRoute.routeId,
          driverId: optimizedRoute.driverId,
          storeId: storeId || 'store_001',
          status: 'PLANNED',
          totalDistance: optimizedRoute.totalDistance,
          totalDuration: optimizedRoute.totalDuration,
          totalValue: optimizedRoute.totalValue,
          efficiencyScore: optimizedRoute.efficiency.score,
          stops: JSON.stringify(optimizedRoute.stops),
          polyline: optimizedRoute.routePolyline,
          createdAt: new Date()
        }
      })
    } catch (dbError) {
      console.error('Failed to save route to database:', dbError)
      // Continue without saving to DB
    }

    // Prepare response
    const response = {
      success: true,
      route: optimizedRoute,
      driver: {
        id: targetDriver.id,
        name: targetDriver.name,
        phone: targetDriver.phone,
        vehicle: targetDriver.vehicle,
        currentLocation: targetDriver.currentLocation
      },
      metadata: {
        optimizationCriteria,
        calculatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        trafficCondition: 'moderate' // In production, get from traffic API
      },
      recommendations: [
        {
          type: 'efficiency',
          message: `Route efficiency: ${optimizedRoute.efficiency.score}/100`,
          action: optimizedRoute.efficiency.score < 70 ? 'Consider redistributing stops' : 'Route looks optimal'
        },
        {
          type: 'timing',
          message: `Estimated total time: ${Math.round(optimizedRoute.totalDuration)} minutes`,
          action: optimizedRoute.totalDuration > 120 ? 'Consider splitting into multiple routes' : 'Good timing'
        }
      ]
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Route optimization error:', error)
    res.status(500).json({ 
      error: 'Failed to optimize route',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 
