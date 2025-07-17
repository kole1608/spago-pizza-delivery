'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data for demo - in real app this would come from API
const mockSalesData = {
  daily: [
    { period: 'Mon', orders: 45, revenue: 1250.50 },
    { period: 'Tue', orders: 52, revenue: 1450.80 },
    { period: 'Wed', orders: 38, revenue: 980.25 },
    { period: 'Thu', orders: 61, revenue: 1680.90 },
    { period: 'Fri', orders: 73, revenue: 2150.60 },
    { period: 'Sat', orders: 85, revenue: 2420.75 },
    { period: 'Sun', orders: 67, revenue: 1890.40 },
  ],
  monthly: [
    { period: 'Jan', orders: 1250, revenue: 35600.50 },
    { period: 'Feb', orders: 1180, revenue: 33200.80 },
    { period: 'Mar', orders: 1420, revenue: 39800.25 },
    { period: 'Apr', orders: 1350, revenue: 37900.90 },
    { period: 'May', orders: 1580, revenue: 44200.60 },
    { period: 'Jun', orders: 1680, revenue: 47100.75 },
  ]
}

interface SalesChartProps {
  period?: 'daily' | 'monthly'
  className?: string
}

export function SalesChart({ period = 'daily', className }: SalesChartProps) {
  const data = mockSalesData[period]
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  const maxOrders = Math.max(...data.map(d => d.orders))
  
  // Calculate growth
  const currentPeriodRevenue = data[data.length - 1]?.revenue || 0
  const previousPeriodRevenue = data[data.length - 2]?.revenue || 0
  const revenueGrowth = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
    : 0

  const currentPeriodOrders = data[data.length - 1]?.orders || 0
  const previousPeriodOrders = data[data.length - 2]?.orders || 0
  const ordersGrowth = previousPeriodOrders > 0 
    ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100 
    : 0

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Sales Overview ({period === 'daily' ? 'Last 7 Days' : 'Last 6 Months'})
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              Revenue: €{currentPeriodRevenue.toFixed(2)}
              {revenueGrowth !== 0 && (
                <span className={`ml-1 ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueGrowth > 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </span>
              )}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Orders: {currentPeriodOrders}
              {ordersGrowth !== 0 && (
                <span className={`ml-1 ${ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ordersGrowth > 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                  {Math.abs(ordersGrowth).toFixed(1)}%
                </span>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-64 flex items-end justify-between gap-2">
            {data.map((item, index) => {
              const revenueHeight = (item.revenue / maxRevenue) * 100
              const ordersHeight = (item.orders / maxOrders) * 100
              
              return (
                <div key={item.period} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bars */}
                  <div className="flex gap-1 items-end h-48">
                    {/* Revenue Bar */}
                    <div 
                      className="bg-orange-500 w-4 rounded-t-sm transition-all duration-300 hover:bg-orange-600"
                      style={{ height: `${revenueHeight}%` }}
                      title={`Revenue: €${item.revenue.toFixed(2)}`}
                    />
                    {/* Orders Bar */}
                    <div 
                      className="bg-blue-500 w-4 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${ordersHeight}%` }}
                      title={`Orders: ${item.orders}`}
                    />
                  </div>
                  
                  {/* Period Label */}
                  <span className="text-xs text-gray-600 font-medium">
                    {item.period}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-sm" />
              <span className="text-sm text-gray-600">Revenue (€)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span className="text-sm text-gray-600">Orders</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                €{data.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-lg font-bold text-gray-900">
                {data.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 