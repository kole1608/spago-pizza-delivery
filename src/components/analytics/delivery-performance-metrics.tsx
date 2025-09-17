'use client'

import { useState, useEffect } from 'react'
import { 
  Truck, 
  Clock, 
  MapPin, 
  Star,
  TrendingUp,
  TrendingDown,
  Navigation,
  Fuel,
  Target,
  Route
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface DeliveryPerformanceMetricsProps {
  period: string
  storeId: string
  compact?: boolean
  className?: string
}

interface DeliveryData {
  totalDeliveries: number
  successfulDeliveries: number
  avgDeliveryTime: number
  onTimeRate: number
  customerSatisfaction: number
  driverPerformance: Array<{
    driverName: string
    deliveries: number
    successRate: number
    avgTime: number
    rating: number
    efficiency: number
  }>
  routeEfficiency: {
    avgDistance: number
    avgStops: number
    fuelEfficiency: number
    optimizationScore: number
  }
  timeAnalysis: Array<{
    hour: number
    deliveries: number
    avgTime: number
  }>
}

export function DeliveryPerformanceMetrics({ 
  period, 
  storeId, 
  compact = false, 
  className 
}: DeliveryPerformanceMetricsProps) {
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryData()
  }, [period, storeId])

  const fetchDeliveryData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/delivery/analytics?period=${period}&storeId=${storeId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch delivery data')
      }

      const data = await response.json()
      setDeliveryData(data.analytics.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to mock data
      setDeliveryData({
        totalDeliveries: 1250,
        successfulDeliveries: 1225,
        avgDeliveryTime: 25,
        onTimeRate: 94.5,
        customerSatisfaction: 4.7,
        driverPerformance: [
          { driverName: 'Marko Petrović', deliveries: 180, successRate: 98.5, avgTime: 22, rating: 4.8, efficiency: 92 },
          { driverName: 'Ana Jovanović', deliveries: 165, successRate: 97.2, avgTime: 24, rating: 4.9, efficiency: 89 },
          { driverName: 'Stefan Nikolić', deliveries: 145, successRate: 96.8, avgTime: 26, rating: 4.6, efficiency: 87 },
        ],
        routeEfficiency: {
          avgDistance: 8.5,
          avgStops: 3.2,
          fuelEfficiency: 12.5,
          optimizationScore: 85
        },
        timeAnalysis: [
          { hour: 11, deliveries: 25, avgTime: 20 },
          { hour: 12, deliveries: 45, avgTime: 22 },
          { hour: 13, deliveries: 38, avgTime: 25 },
          { hour: 18, deliveries: 65, avgTime: 28 },
          { hour: 19, deliveries: 85, avgTime: 32 },
          { hour: 20, deliveries: 75, avgTime: 30 },
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
            <p>Failed to load delivery analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!deliveryData) return null

  const successRate = (deliveryData.successfulDeliveries / deliveryData.totalDeliveries) * 100

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Performance</h2>
          <p className="text-gray-600">
            Delivery metrics and driver performance for {period}
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">
                {deliveryData.totalDeliveries.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                +12% vs last {period}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900">{deliveryData.avgDeliveryTime}m</p>
              <p className="text-sm text-green-600">
                -2m vs last {period}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-gray-900">{deliveryData.onTimeRate}%</p>
              <p className="text-sm text-green-600">
                +3.2% vs last {period}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Rating</p>
              <p className="text-2xl font-bold text-gray-900">{deliveryData.customerSatisfaction}</p>
              <p className="text-sm text-green-600">
                +0.2 vs last {period}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Driver Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveryData.driverPerformance.map((driver) => (
                <div key={driver.driverName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{driver.driverName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{driver.deliveries} deliveries</span>
                      <Badge variant="outline" className="text-xs">
                        {driver.rating}★
                      </Badge>
                    </div>
                  </div>
                  <Progress value={driver.efficiency} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{driver.successRate}% success</span>
                    <span>{driver.avgTime}m avg time</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Route Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle>Route Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Optimization Score</span>
                <span className="font-medium">{deliveryData.routeEfficiency.optimizationScore}%</span>
              </div>
              <Progress value={deliveryData.routeEfficiency.optimizationScore} className="h-2" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Avg Distance</p>
                  <p className="font-bold">{deliveryData.routeEfficiency.avgDistance}km</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Stops</p>
                  <p className="font-bold">{deliveryData.routeEfficiency.avgStops}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fuel Efficiency</p>
                  <p className="font-bold">{deliveryData.routeEfficiency.fuelEfficiency}L/100km</p>
                </div>
                <div>
                  <p className="text-gray-600">Success Rate</p>
                  <p className="font-bold">{successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Analysis */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {deliveryData.timeAnalysis.map((timeSlot) => (
                <div key={timeSlot.hour} className="text-center p-3 border rounded-lg">
                  <p className="font-medium text-sm">{timeSlot.hour}:00</p>
                  <p className="text-lg font-bold text-blue-600">{timeSlot.deliveries}</p>
                  <p className="text-xs text-gray-500">{timeSlot.avgTime}m avg</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}