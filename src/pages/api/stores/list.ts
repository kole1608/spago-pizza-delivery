import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Store {
  id: string
  name: string
  address: string
  phone: string
  email: string
  isActive: boolean
  isMainStore: boolean
  coordinates: {
    lat: number
    lng: number
  }
  deliveryRadius: number
  operatingHours: {
    [key: string]: {
      open: string
      close: string
      isOpen: boolean
    }
  }
  settings: {
    allowOnlineOrdering: boolean
    acceptsCash: boolean
    acceptsCards: boolean
    minimumOrderAmount: number
    deliveryFee: number
    maxOrdersPerHour: number
  }
  staff: Array<{
    id: string
    name: string
    role: string
    isActive: boolean
  }>
  performance: {
    dailyRevenue: number
    weeklyRevenue: number
    monthlyRevenue: number
    totalOrders: number
    avgOrderValue: number
    customerRating: number
    deliveryTime: number
  }
  inventory: {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    lastUpdated: string
  }
}

// Mock store data
const mockStores: Store[] = [
  {
    id: 'store_001',
    name: 'Spago Pizza - Belgrade Center',
    address: 'Knez Mihailova 10, Belgrade, Serbia',
    phone: '+381 11 123 4567',
    email: 'center@spagopizza.rs',
    isActive: true,
    isMainStore: true,
    coordinates: { lat: 44.8176, lng: 20.4633 },
    deliveryRadius: 15,
    operatingHours: {
      monday: { open: '10:00', close: '23:00', isOpen: true },
      tuesday: { open: '10:00', close: '23:00', isOpen: true },
      wednesday: { open: '10:00', close: '23:00', isOpen: true },
      thursday: { open: '10:00', close: '23:00', isOpen: true },
      friday: { open: '10:00', close: '24:00', isOpen: true },
      saturday: { open: '11:00', close: '24:00', isOpen: true },
      sunday: { open: '12:00', close: '22:00', isOpen: true }
    },
    settings: {
      allowOnlineOrdering: true,
      acceptsCash: true,
      acceptsCards: true,
      minimumOrderAmount: 15,
      deliveryFee: 3,
      maxOrdersPerHour: 50
    },
    staff: [
      { id: 'staff_001', name: 'Marko Petrović', role: 'Manager', isActive: true },
      { id: 'staff_002', name: 'Ana Jovanović', role: 'Chef', isActive: true },
      { id: 'staff_003', name: 'Stefan Nikolić', role: 'Driver', isActive: true }
    ],
    performance: {
      dailyRevenue: 2850,
      weeklyRevenue: 18200,
      monthlyRevenue: 76500,
      totalOrders: 1250,
      avgOrderValue: 28.5,
      customerRating: 4.7,
      deliveryTime: 25
    },
    inventory: {
      totalItems: 45,
      lowStockItems: 5,
      outOfStockItems: 1,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    id: 'store_002',
    name: 'Spago Pizza - New Belgrade',
    address: 'Bulevar Mihajla Pupina 165, Belgrade, Serbia',
    phone: '+381 11 234 5678',
    email: 'newbelgrade@spagopizza.rs',
    isActive: true,
    isMainStore: false,
    coordinates: { lat: 44.8225, lng: 20.4116 },
    deliveryRadius: 12,
    operatingHours: {
      monday: { open: '11:00', close: '23:00', isOpen: true },
      tuesday: { open: '11:00', close: '23:00', isOpen: true },
      wednesday: { open: '11:00', close: '23:00', isOpen: true },
      thursday: { open: '11:00', close: '23:00', isOpen: true },
      friday: { open: '11:00', close: '24:00', isOpen: true },
      saturday: { open: '11:00', close: '24:00', isOpen: true },
      sunday: { open: '12:00', close: '22:00', isOpen: true }
    },
    settings: {
      allowOnlineOrdering: true,
      acceptsCash: true,
      acceptsCards: true,
      minimumOrderAmount: 12,
      deliveryFee: 2.5,
      maxOrdersPerHour: 35
    },
    staff: [
      { id: 'staff_004', name: 'Milica Stojanović', role: 'Manager', isActive: true },
      { id: 'staff_005', name: 'Nikola Mitrović', role: 'Chef', isActive: true },
      { id: 'staff_006', name: 'Jovana Đorđević', role: 'Driver', isActive: false }
    ],
    performance: {
      dailyRevenue: 2100,
      weeklyRevenue: 14200,
      monthlyRevenue: 58900,
      totalOrders: 890,
      avgOrderValue: 26.8,
      customerRating: 4.5,
      deliveryTime: 28
    },
    inventory: {
      totalItems: 42,
      lowStockItems: 3,
      outOfStockItems: 0,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'store_003',
    name: 'Spago Pizza - Zemun',
    address: 'Glavna 25, Zemun, Serbia',
    phone: '+381 11 345 6789',
    email: 'zemun@spagopizza.rs',
    isActive: true,
    isMainStore: false,
    coordinates: { lat: 44.8431, lng: 20.4138 },
    deliveryRadius: 10,
    operatingHours: {
      monday: { open: '11:00', close: '22:00', isOpen: true },
      tuesday: { open: '11:00', close: '22:00', isOpen: true },
      wednesday: { open: '11:00', close: '22:00', isOpen: true },
      thursday: { open: '11:00', close: '22:00', isOpen: true },
      friday: { open: '11:00', close: '23:00', isOpen: true },
      saturday: { open: '11:00', close: '23:00', isOpen: true },
      sunday: { open: '12:00', close: '21:00', isOpen: true }
    },
    settings: {
      allowOnlineOrdering: true,
      acceptsCash: true,
      acceptsCards: true,
      minimumOrderAmount: 10,
      deliveryFee: 2,
      maxOrdersPerHour: 25
    },
    staff: [
      { id: 'staff_007', name: 'Petra Stanković', role: 'Manager', isActive: true },
      { id: 'staff_008', name: 'Marija Janković', role: 'Chef', isActive: true }
    ],
    performance: {
      dailyRevenue: 1650,
      weeklyRevenue: 11200,
      monthlyRevenue: 45800,
      totalOrders: 680,
      avgOrderValue: 24.2,
      customerRating: 4.6,
      deliveryTime: 22
    },
    inventory: {
      totalItems: 38,
      lowStockItems: 7,
      outOfStockItems: 2,
      lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  }
]

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
      includeInactive = 'false',
      includePerformance = 'true',
      includeInventory = 'true',
      region,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query

    // In a real application, fetch from database
    let stores = [...mockStores]

    // Filter inactive stores
    if (includeInactive === 'false') {
      stores = stores.filter(store => store.isActive)
    }

    // Filter by region if specified
    if (region) {
      // Simple region filtering based on store name
      stores = stores.filter(store => 
        store.name.toLowerCase().includes((region as string).toLowerCase())
      )
    }

    // Sort stores
    stores.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'performance':
          aValue = a.performance.monthlyRevenue
          bValue = b.performance.monthlyRevenue
          break
        case 'orders':
          aValue = a.performance.totalOrders
          bValue = b.performance.totalOrders
          break
        case 'rating':
          aValue = a.performance.customerRating
          bValue = b.performance.customerRating
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortOrder === 'desc' ? -comparison : comparison
      } else {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
      }
    })

    // Remove sensitive data based on user role
    const sanitizedStores = stores.map(store => {
      const sanitizedStore = { ...store }

      // Remove sensitive information for non-admin users
      if (session.user.role !== Role.ADMIN) {
        delete sanitizedStore.staff
        
        if (includePerformance === 'false') {
          delete sanitizedStore.performance
        }
        
        if (includeInventory === 'false') {
          delete sanitizedStore.inventory
        }
      }

      return sanitizedStore
    })

    // Calculate aggregated stats
    const aggregatedStats = {
      totalStores: stores.length,
      activeStores: stores.filter(s => s.isActive).length,
      totalRevenue: stores.reduce((sum, s) => sum + s.performance.monthlyRevenue, 0),
      totalOrders: stores.reduce((sum, s) => sum + s.performance.totalOrders, 0),
      avgRating: stores.reduce((sum, s) => sum + s.performance.customerRating, 0) / stores.length,
      avgDeliveryTime: stores.reduce((sum, s) => sum + s.performance.deliveryTime, 0) / stores.length,
      totalStaff: stores.reduce((sum, s) => sum + s.staff.length, 0),
      lowStockAlerts: stores.reduce((sum, s) => sum + s.inventory.lowStockItems, 0),
      outOfStockAlerts: stores.reduce((sum, s) => sum + s.inventory.outOfStockItems, 0)
    }

    // Regional breakdown
    const regionalStats = stores.reduce((acc, store) => {
      const region = store.name.split(' - ')[1] || 'Unknown'
      if (!acc[region]) {
        acc[region] = {
          stores: 0,
          revenue: 0,
          orders: 0,
          avgRating: 0
        }
      }
      
      acc[region].stores += 1
      acc[region].revenue += store.performance.monthlyRevenue
      acc[region].orders += store.performance.totalOrders
      acc[region].avgRating += store.performance.customerRating
      
      return acc
    }, {} as any)

    // Calculate averages for regional stats
    Object.keys(regionalStats).forEach(region => {
      regionalStats[region].avgRating = regionalStats[region].avgRating / regionalStats[region].stores
    })

    res.status(200).json({
      stores: sanitizedStores,
      metadata: {
        total: stores.length,
        filtered: sanitizedStores.length,
        sortBy,
        sortOrder,
        lastUpdated: new Date().toISOString()
      },
      aggregatedStats,
      regionalStats
    })

  } catch (error) {
    console.error('Error fetching stores:', error)
    res.status(500).json({ 
      error: 'Failed to fetch stores',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 
