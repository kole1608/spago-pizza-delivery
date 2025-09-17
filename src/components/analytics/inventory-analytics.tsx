'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingDown,
  BarChart3,
  DollarSign,
  Clock,
  Truck,
  Target
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface InventoryAnalyticsProps {
  period: string
  storeId: string
  compact?: boolean
  className?: string
}

interface InventoryData {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalValue: number
  turnoverRate: number
  wastePercentage: number
  topItems: Array<{
    name: string
    usage: number
    efficiency: number
    status: 'healthy' | 'low' | 'critical'
  }>
  stockLevels: Array<{
    name: string
    currentStock: number
    minimumStock: number
    status: 'healthy' | 'low' | 'critical' | 'overstock'
    daysRemaining: number
  }>
}

export function InventoryAnalytics({ 
  period, 
  storeId, 
  compact = false, 
  className 
}: InventoryAnalyticsProps) {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInventoryData()
  }, [period, storeId])

  const fetchInventoryData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/inventory?period=${period}&storeId=${storeId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data')
      }

      const data = await response.json()
      setInventoryData(data.metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to mock data
      setInventoryData({
        totalItems: 45,
        lowStockItems: 5,
        outOfStockItems: 1,
        totalValue: 2850.75,
        turnoverRate: 3.2,
        wastePercentage: 2.5,
        topItems: [
          { name: 'Mozzarella Cheese', usage: 85, efficiency: 92, status: 'healthy' },
          { name: 'Pizza Dough', usage: 120, efficiency: 88, status: 'low' },
          { name: 'Tomato Sauce', usage: 95, efficiency: 90, status: 'healthy' },
          { name: 'Pepperoni', usage: 65, efficiency: 85, status: 'critical' },
        ],
        stockLevels: [
          { name: 'Mozzarella Cheese', currentStock: 25, minimumStock: 15, status: 'healthy', daysRemaining: 8 },
          { name: 'Pizza Dough', currentStock: 8, minimumStock: 10, status: 'low', daysRemaining: 3 },
          { name: 'Pepperoni', currentStock: 0, minimumStock: 5, status: 'critical', daysRemaining: 0 },
          { name: 'Fresh Basil', currentStock: 45, minimumStock: 10, status: 'overstock', daysRemaining: 15 },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load inventory analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!inventoryData) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'low': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      case 'overstock': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      case 'low': return <TrendingDown className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inventory Analytics</h2>
          <p className="text-gray-600">
            Stock levels and inventory performance for {period}
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryData.totalItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{inventoryData.lowStockItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{inventoryData.outOfStockItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                €{inventoryData.totalValue.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Critical Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryData.stockLevels
                .filter(item => item.status !== 'healthy')
                .map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.currentStock} / {item.minimumStock} minimum
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.daysRemaining} days left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Usage Items */}
        <Card>
          <CardHeader>
            <CardTitle>High Usage Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryData.topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.usage} units used</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.efficiency}% efficiency</p>
                    <Badge className={getStatusColor(item.status)} variant="secondary">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {inventoryData.turnoverRate.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">Turnover Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {inventoryData.wastePercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Waste Percentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {((inventoryData.totalItems - inventoryData.outOfStockItems) / inventoryData.totalItems * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Availability Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}