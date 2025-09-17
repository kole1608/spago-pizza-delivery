'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  TrendingUp, 
  Heart, 
  ShoppingCart,
  Clock,
  MapPin,
  Star,
  Target,
  Calendar,
  Filter
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface CustomerBehaviorAnalyticsProps {
  period: string
  storeId: string
  compact?: boolean
  className?: string
}

interface CustomerData {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  churnRate: number
  averageLifetimeValue: number
  topCustomers: Array<{
    id: string
    name: string
    totalSpent: number
    orderCount: number
    loyaltyTier: string
  }>
  behaviorPatterns: Array<{
    dayOfWeek: string
    orders: number
    customers: number
  }>
  segmentDistribution: Array<{
    segment: string
    count: number
    percentage: number
    avgSpend: number
  }>
}

export function CustomerBehaviorAnalytics({ 
  period, 
  storeId, 
  compact = false, 
  className 
}: CustomerBehaviorAnalyticsProps) {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomerData()
  }, [period, storeId])

  const fetchCustomerData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/customers?period=${period}&storeId=${storeId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer data')
      }

      const data = await response.json()
      setCustomerData(data.metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to mock data
      setCustomerData({
        totalCustomers: 1250,
        newCustomers: 180,
        returningCustomers: 320,
        churnRate: 12.5,
        averageLifetimeValue: 145.80,
        topCustomers: [
          { id: '1', name: 'John Smith', totalSpent: 450.00, orderCount: 15, loyaltyTier: 'Gold' },
          { id: '2', name: 'Sarah Johnson', totalSpent: 380.50, orderCount: 12, loyaltyTier: 'Silver' },
          { id: '3', name: 'Mike Wilson', totalSpent: 320.75, orderCount: 10, loyaltyTier: 'Silver' },
        ],
        behaviorPatterns: [
          { dayOfWeek: 'Monday', orders: 45, customers: 38 },
          { dayOfWeek: 'Tuesday', orders: 52, customers: 42 },
          { dayOfWeek: 'Wednesday', orders: 48, customers: 40 },
          { dayOfWeek: 'Thursday', orders: 65, customers: 55 },
          { dayOfWeek: 'Friday', orders: 85, customers: 70 },
          { dayOfWeek: 'Saturday', orders: 92, customers: 75 },
          { dayOfWeek: 'Sunday', orders: 78, customers: 65 },
        ],
        segmentDistribution: [
          { segment: 'Champions', count: 125, percentage: 10, avgSpend: 85.50 },
          { segment: 'Loyal Customers', count: 250, percentage: 20, avgSpend: 65.25 },
          { segment: 'Potential Loyalists', count: 375, percentage: 30, avgSpend: 45.80 },
          { segment: 'New Customers', count: 300, percentage: 24, avgSpend: 28.90 },
          { segment: 'At Risk', count: 200, percentage: 16, avgSpend: 35.60 },
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
            <p>Failed to load customer analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!customerData) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800'
      case 'Gold': return 'bg-yellow-100 text-yellow-800'
      case 'Silver': return 'bg-gray-100 text-gray-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Behavior Analytics</h2>
          <p className="text-gray-600">
            Customer insights and behavior patterns for {period}
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customerData.totalCustomers.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                +{customerData.newCustomers} new this {period}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-500">{customerData.churnRate.toFixed(1)}%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Returning Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {((customerData.returningCustomers / customerData.totalCustomers) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">
                {customerData.returningCustomers} customers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Lifetime Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(customerData.averageLifetimeValue)}
              </p>
              <p className="text-sm text-green-600">
                +8.5% vs last {period}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-red-600">{customerData.churnRate.toFixed(1)}%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {customerData.churnRate.toFixed(1)}%
              </p>
              <p className="text-sm text-red-600">
                -2.1% vs last {period}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerData.segmentDistribution.map((segment) => (
                <div key={segment.segment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{segment.segment}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{segment.count}</span>
                      <Badge variant="outline" className="text-xs">
                        {segment.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Avg spend: {formatCurrency(segment.avgSpend)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Behavior Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Order Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerData.behaviorPatterns.map((pattern) => {
                const maxOrders = Math.max(...customerData.behaviorPatterns.map(p => p.orders))
                const percentage = (pattern.orders / maxOrders) * 100
                
                return (
                  <div key={pattern.dayOfWeek} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{pattern.dayOfWeek}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{pattern.orders} orders</span>
                        <span className="text-xs text-gray-500">{pattern.customers} customers</span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerData.topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.orderCount} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatCurrency(customer.totalSpent)}</p>
                  <Badge className={getTierColor(customer.loyaltyTier)} variant="secondary">
                    {customer.loyaltyTier}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}