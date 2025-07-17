'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Settings,
  Eye,
  PieChart,
  Activity
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { SalesAnalytics } from './sales-analytics'
import { CustomerBehaviorAnalytics } from './customer-behavior-analytics'
import { InventoryAnalytics } from './inventory-analytics'
import { DeliveryPerformanceMetrics } from './delivery-performance-metrics'

interface AdvancedDashboardProps {
  className?: string
  defaultView?: string
}

interface KPIMetric {
  id: string
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'stable'
  target?: number
  format: 'currency' | 'number' | 'percentage'
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}

interface DashboardState {
  selectedPeriod: string
  selectedStore: string
  selectedView: string
  autoRefresh: boolean
  refreshInterval: number
  isLoading: boolean
  lastUpdated: Date | null
}

export function AdvancedDashboard({ className, defaultView = 'overview' }: AdvancedDashboardProps) {
  const { data: session } = useSession()
  const [state, setState] = useState<DashboardState>({
    selectedPeriod: 'month',
    selectedStore: 'all',
    selectedView: defaultView,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
    isLoading: false,
    lastUpdated: null
  })

  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: 0,
      change: 0,
      trend: 'stable',
      target: 50000,
      format: 'currency',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: 0,
      change: 0,
      trend: 'stable',
      target: 1000,
      format: 'number',
      icon: Package,
      color: 'blue'
    },
    {
      id: 'customers',
      label: 'Active Customers',
      value: 0,
      change: 0,
      trend: 'stable',
      target: 500,
      format: 'number',
      icon: Users,
      color: 'purple'
    },
    {
      id: 'aov',
      label: 'Avg Order Value',
      value: 0,
      change: 0,
      trend: 'stable',
      target: 35,
      format: 'currency',
      icon: TrendingUp,
      color: 'orange'
    }
  ])

  const [quickInsights, setQuickInsights] = useState([
    {
      type: 'success',
      title: 'Peak Performance',
      message: 'Friday evening shows 180% higher orders than average',
      action: 'Optimize staffing'
    },
    {
      type: 'warning',
      title: 'Inventory Alert',
      message: '5 ingredients running low, affecting 12 menu items',
      action: 'Review stock levels'
    },
    {
      type: 'info',
      title: 'Customer Trend',
      message: 'Mobile app orders increased 25% this month',
      action: 'Enhance mobile experience'
    }
  ])

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Fetch data from multiple analytics endpoints
      const [salesResponse, customerResponse] = await Promise.all([
        fetch(`/api/analytics/sales?period=${state.selectedPeriod}&storeId=${state.selectedStore}`),
        fetch(`/api/analytics/customers?period=${state.selectedPeriod}&storeId=${state.selectedStore}`)
      ])

      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        const metrics = salesData.metrics

        // Update KPI metrics
        setKpiMetrics(prev => prev.map(kpi => {
          switch (kpi.id) {
            case 'revenue':
              return {
                ...kpi,
                value: metrics.totalRevenue,
                change: salesData.metadata.growthRates.revenue || 0,
                trend: (salesData.metadata.growthRates.revenue || 0) > 0 ? 'up' : 
                      (salesData.metadata.growthRates.revenue || 0) < 0 ? 'down' : 'stable'
              }
            case 'orders':
              return {
                ...kpi,
                value: metrics.totalOrders,
                change: salesData.metadata.growthRates.orders || 0,
                trend: (salesData.metadata.growthRates.orders || 0) > 0 ? 'up' : 
                      (salesData.metadata.growthRates.orders || 0) < 0 ? 'down' : 'stable'
              }
            case 'aov':
              return {
                ...kpi,
                value: metrics.averageOrderValue,
                change: salesData.metadata.growthRates.aov || 0,
                trend: (salesData.metadata.growthRates.aov || 0) > 0 ? 'up' : 
                      (salesData.metadata.growthRates.aov || 0) < 0 ? 'down' : 'stable'
              }
            default:
              return kpi
          }
        }))
      }

      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        
        setKpiMetrics(prev => prev.map(kpi => {
          if (kpi.id === 'customers') {
            return {
              ...kpi,
              value: customerData.metrics.totalCustomers,
              change: 12.5, // Mock change percentage
              trend: 'up'
            }
          }
          return kpi
        }))
      }

      setState(prev => ({ ...prev, lastUpdated: new Date() }))

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Auto-refresh setup
  useEffect(() => {
    fetchDashboardData()
  }, [state.selectedPeriod, state.selectedStore])

  useEffect(() => {
    if (state.autoRefresh) {
      const interval = setInterval(fetchDashboardData, state.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [state.autoRefresh, state.refreshInterval])

  const formatValue = (value: string | number, format: string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(numValue)
      case 'percentage':
        return `${numValue.toFixed(1)}%`
      default:
        return new Intl.NumberFormat('en-US').format(numValue)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
      default:
        return <Activity className="h-3 w-3 text-gray-600" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '🎯'
      case 'warning':
        return '⚠️'
      case 'info':
        return '💡'
      default:
        return 'ℹ️'
    }
  }

  const exportDashboard = () => {
    // In a real app, this would generate PDF/Excel export
    const dashboardData = {
      metrics: kpiMetrics,
      period: state.selectedPeriod,
      store: state.selectedStore,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-export-${new Date().getTime()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view analytics</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {state.lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {state.lastUpdated.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportDashboard}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={state.isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={state.selectedPeriod} onValueChange={(value) => 
            setState(prev => ({ ...prev, selectedPeriod: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={state.selectedStore} onValueChange={(value) => 
            setState(prev => ({ ...prev, selectedStore: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              <SelectItem value="store_1">Belgrade Center</SelectItem>
              <SelectItem value="store_2">New Belgrade</SelectItem>
              <SelectItem value="store_3">Zemun</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={state.autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Auto-refresh {state.autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiMetrics.map((metric) => {
          const IconComponent = metric.icon
          const progressPercentage = metric.target ? 
            Math.min((typeof metric.value === 'number' ? metric.value : parseFloat(metric.value.toString())) / metric.target * 100, 100) : 0

          return (
            <Card key={metric.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-${metric.color}-100`}>
                    <IconComponent className={`h-6 w-6 text-${metric.color}-600`} />
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${
                      metric.change > 0 ? 'text-green-600' : 
                      metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                    
                    {metric.target && (
                      <span className="text-gray-500">
                        Target: {formatValue(metric.target, metric.format)}
                      </span>
                    )}
                  </div>
                  
                  {metric.target && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${metric.color}-600 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Insights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{insight.message}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    {insight.action} →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs value={state.selectedView} onValueChange={(value) => 
        setState(prev => ({ ...prev, selectedView: value }))}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesAnalytics 
              period={state.selectedPeriod} 
              storeId={state.selectedStore}
              compact={true}
            />
            <CustomerBehaviorAnalytics 
              period={state.selectedPeriod} 
              storeId={state.selectedStore}
              compact={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesAnalytics 
            period={state.selectedPeriod} 
            storeId={state.selectedStore}
          />
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <CustomerBehaviorAnalytics 
            period={state.selectedPeriod} 
            storeId={state.selectedStore}
          />
        </TabsContent>

        <TabsContent value="operations" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <InventoryAnalytics 
              period={state.selectedPeriod} 
              storeId={state.selectedStore}
              compact={true}
            />
            <DeliveryPerformanceMetrics 
              period={state.selectedPeriod} 
              storeId={state.selectedStore}
              compact={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 