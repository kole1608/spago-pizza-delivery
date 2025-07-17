'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Clock, 
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface SalesAnalyticsProps {
  period: string
  storeId: string
  compact?: boolean
  className?: string
}

interface SalesData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
    growthRate: number
  }>
  dailySales: Array<{
    date: string
    revenue: number
    orders: number
    averageOrderValue: number
  }>
  hourlyDistribution: Array<{
    hour: number
    orders: number
    revenue: number
    averageWaitTime: number
  }>
  channelPerformance: Array<{
    channel: string
    orders: number
    revenue: number
    conversionRate: number
  }>
  predictiveMetrics: {
    projectedRevenue: number
    demandForecast: Array<{
      date: string
      predictedOrders: number
      confidence: number
    }>
    seasonalTrends: Array<{
      period: string
      multiplier: number
    }>
  }
}

interface GrowthRates {
  revenue: number
  orders: number
  aov: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function SalesAnalytics({ period, storeId, compact = false, className }: SalesAnalyticsProps) {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [growthRates, setGrowthRates] = useState<GrowthRates | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'aov'>('revenue')

  useEffect(() => {
    fetchSalesData()
  }, [period, storeId])

  const fetchSalesData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/sales?period=${period}&storeId=${storeId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data')
      }

      const data = await response.json()
      setSalesData(data.metrics)
      setGrowthRates(data.metadata.growthRates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value)
  }

  const getTrendIcon = (growth: number) => {
    if (growth > 2) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (growth < -2) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getTrendColor = (growth: number) => {
    if (growth > 2) return 'text-green-600'
    if (growth < -2) return 'text-red-600'
    return 'text-gray-600'
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load sales analytics</p>
            <Button onClick={fetchSalesData} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    )
  }

  if (!salesData) return null

  // Prepare chart data
  const salesChartData = salesData.dailySales.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  const hourlyChartData = salesData.hourlyDistribution.map(hour => ({
    ...hour,
    time: `${hour.hour.toString().padStart(2, '0')}:00`
  }))

  const channelChartData = salesData.channelPerformance.map((channel, index) => ({
    ...channel,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sales Analytics</h2>
          <p className="text-gray-600">
            Revenue performance and sales trends for {period}
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {growthRates && getTrendIcon(growthRates.revenue)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesData.totalRevenue)}
              </p>
              {growthRates && (
                <p className={`text-sm font-medium ${getTrendColor(growthRates.revenue)}`}>
                  {growthRates.revenue > 0 ? '+' : ''}{growthRates.revenue.toFixed(1)}% vs last period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              {growthRates && getTrendIcon(growthRates.orders)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesData.totalOrders.toLocaleString()}
              </p>
              {growthRates && (
                <p className={`text-sm font-medium ${getTrendColor(growthRates.orders)}`}>
                  {growthRates.orders > 0 ? '+' : ''}{growthRates.orders.toFixed(1)}% vs last period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              {growthRates && getTrendIcon(growthRates.aov)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesData.averageOrderValue)}
              </p>
              {growthRates && (
                <p className={`text-sm font-medium ${getTrendColor(growthRates.aov)}`}>
                  {growthRates.aov > 0 ? '+' : ''}{growthRates.aov.toFixed(1)}% vs last period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Revenue Trend</span>
              <div className="flex gap-2">
                <Button
                  variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('revenue')}
                >
                  Revenue
                </Button>
                <Button
                  variant={selectedMetric === 'orders' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('orders')}
                >
                  Orders
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={compact ? 200 : 300}>
              <AreaChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    selectedMetric === 'revenue' ? formatCurrency(Number(value)) : value,
                    name
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name={selectedMetric === 'revenue' ? 'Revenue' : 'Orders'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Sales Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={compact ? 200 : 300}>
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name
                  ]}
                />
                <Legend />
                <Bar dataKey="orders" fill="#8884d8" name="Orders" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
              <PieChart>
                <Pie
                  data={channelChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={compact ? 60 : 80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {channelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2 mt-4">
              {salesData.channelPerformance.map((channel, index) => (
                <div key={channel.channel} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{channel.channel}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(channel.revenue)}</p>
                    <p className="text-xs text-gray-500">{channel.conversionRate}% conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData.topProducts.slice(0, compact ? 5 : 8).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(product.growthRate)}
                      <span className={`text-xs ${getTrendColor(product.growthRate)}`}>
                        {product.growthRate > 0 ? '+' : ''}{product.growthRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Analytics */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predictive Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Projected Revenue</p>
                <p className="text-xl font-bold text-blue-800">
                  {formatCurrency(salesData.predictiveMetrics.projectedRevenue)}
                </p>
                <p className="text-xs text-blue-600">Next period estimate</p>
              </div>

              {salesData.predictiveMetrics.seasonalTrends.slice(0, 3).map((trend, index) => (
                <div key={index} className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-900">{trend.period}</p>
                  <p className="text-xl font-bold text-green-800">
                    {(trend.multiplier * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-green-600">of baseline</p>
                </div>
              ))}
            </div>

            {salesData.predictiveMetrics.demandForecast.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">7-Day Demand Forecast</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={salesData.predictiveMetrics.demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predictedOrders" 
                      stroke="#8884d8" 
                      strokeDasharray="5 5"
                      name="Predicted Orders"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#82ca9d" 
                      name="Confidence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 