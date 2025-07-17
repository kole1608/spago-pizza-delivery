'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { useWebSocketStore } from '@/stores/websocket-store'
import { ROOMS } from '@/lib/socket-server'

interface StatsCardProps {
  title: string
  value: string | number
  previousValue?: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple'
  isLoading?: boolean
}

interface RealTimeOrderStatsProps {
  className?: string
  storeId?: string
  refreshInterval?: number
}

const StatsCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue',
  isLoading = false
}: StatsCardProps) => {
  const [displayValue, setDisplayValue] = useState(previousValue || 0)
  
  useEffect(() => {
    if (value !== displayValue) {
      // Animate number change
      const startValue = Number(displayValue) || 0
      const endValue = Number(value) || 0
      const difference = endValue - startValue
      const duration = 1000 // 1 second
      const steps = 60
      const stepValue = difference / steps
      const stepDuration = duration / steps
      
      let currentStep = 0
      const interval = setInterval(() => {
        currentStep++
        const newValue = startValue + (stepValue * currentStep)
        setDisplayValue(Math.round(newValue * 100) / 100)
        
        if (currentStep >= steps) {
          setDisplayValue(endValue)
          clearInterval(interval)
        }
      }, stepDuration)
      
      return () => clearInterval(interval)
    }
  }, [value, displayValue])

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'orange':
        return 'bg-orange-100 text-orange-600'
      case 'red':
        return 'bg-red-100 text-red-600'
      case 'purple':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-blue-100 text-blue-600'
    }
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-600" />
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-600" />
    return null
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center gap-2">
              <motion.p 
                key={displayValue}
                initial={{ scale: 1.1, color: '#3b82f6' }}
                animate={{ scale: 1, color: '#111827' }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold text-gray-900"
              >
                {isLoading ? '...' : displayValue}
              </motion.p>
              {trend && trendValue && (
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className={`text-xs font-medium ${
                    trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${getColorClasses(color)}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function RealTimeOrderStats({ 
  className, 
  storeId = 'default',
  refreshInterval = 30000 // 30 seconds
}: RealTimeOrderStatsProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [previousStats, setPreviousStats] = useState<any>(null)
  
  const {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    dashboardStats,
    kitchenQueue,
    isConnected,
    requestDashboardStats
  } = useWebSocketStore()

  useEffect(() => {
    if (session?.user?.id) {
      // Connect to WebSocket
      connect(session.user.id, session.user.role as any || 'admin')
      
      // Join dashboard room
      joinRoom(ROOMS.DASHBOARD(storeId))
      
      // Request initial stats
      requestDashboardStats()
      
      // Set up periodic refresh
      const interval = setInterval(() => {
        requestDashboardStats()
      }, refreshInterval)
      
      return () => {
        clearInterval(interval)
        leaveRoom(ROOMS.DASHBOARD(storeId))
      }
    }
  }, [session?.user?.id, storeId, refreshInterval, connect, joinRoom, leaveRoom, requestDashboardStats])

  useEffect(() => {
    if (dashboardStats) {
      setPreviousStats(dashboardStats)
      setIsLoading(false)
    }
  }, [dashboardStats])

  // Calculate trends (simplified)
  const getTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'stable', value: string } => {
    if (!previous || previous === 0) return { trend: 'stable', value: '0%' }
    
    const change = ((current - previous) / previous) * 100
    if (Math.abs(change) < 1) return { trend: 'stable', value: '0%' }
    
    return {
      trend: change > 0 ? 'up' : 'down',
      value: `${Math.abs(change).toFixed(1)}%`
    }
  }

  // Mock previous data for trend calculation
  const mockPreviousStats = {
    todayOrders: dashboardStats?.todayOrders ? dashboardStats.todayOrders - Math.floor(Math.random() * 10) : 0,
    todayRevenue: dashboardStats?.todayRevenue ? dashboardStats.todayRevenue - Math.random() * 100 : 0,
    activeOrders: dashboardStats?.activeOrders ? dashboardStats.activeOrders - Math.floor(Math.random() * 5) : 0,
    averageDeliveryTime: dashboardStats?.averageDeliveryTime ? dashboardStats.averageDeliveryTime + Math.floor(Math.random() * 5) : 0,
  }

  const ordersTrend = getTrend(dashboardStats?.todayOrders || 0, mockPreviousStats.todayOrders)
  const revenueTrend = getTrend(dashboardStats?.todayRevenue || 0, mockPreviousStats.todayRevenue)
  const activeTrend = getTrend(dashboardStats?.activeOrders || 0, mockPreviousStats.activeOrders)
  const deliveryTrend = getTrend(dashboardStats?.averageDeliveryTime || 0, mockPreviousStats.averageDeliveryTime)

  // Kitchen performance metrics
  const kitchenEfficiency = kitchenQueue?.activeOrders ? 
    Math.max(0, 100 - (kitchenQueue.activeOrders * 10)) : 85
  
  const orderCapacity = kitchenQueue?.activeOrders ? 
    Math.min(100, (kitchenQueue.activeOrders / 20) * 100) : 30

  return (
    <div className={className}>
      {/* Connection Status */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Live Order Statistics</h2>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
          {isLoading && (
            <Badge variant="outline">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
              <Skeleton className='h-4 w-20' />
            </Badge>
          )}
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Today's Orders"
          value={dashboardStats?.todayOrders || 0}
          previousValue={mockPreviousStats.todayOrders}
          icon={Package}
          trend={ordersTrend.trend}
          trendValue={ordersTrend.value}
          color="blue"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Today's Revenue"
          value={`€${(dashboardStats?.todayRevenue || 0).toFixed(2)}`}
          previousValue={`€${mockPreviousStats.todayRevenue.toFixed(2)}`}
          icon={DollarSign}
          trend={revenueTrend.trend}
          trendValue={revenueTrend.value}
          color="green"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Active Orders"
          value={dashboardStats?.activeOrders || 0}
          previousValue={mockPreviousStats.activeOrders}
          icon={Users}
          trend={activeTrend.trend}
          trendValue={activeTrend.value}
          color="orange"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Avg Delivery Time"
          value={`${dashboardStats?.averageDeliveryTime || 0}m`}
          previousValue={`${mockPreviousStats.averageDeliveryTime}m`}
          icon={Clock}
          trend={deliveryTrend.trend === 'down' ? 'up' : deliveryTrend.trend === 'up' ? 'down' : 'stable'} // Reverse for delivery time
          trendValue={deliveryTrend.value}
          color="purple"
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Kitchen Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Kitchen Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Efficiency</span>
                <span className="font-medium">{kitchenEfficiency}%</span>
              </div>
              <Progress value={kitchenEfficiency} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Order Capacity</span>
                <span className="font-medium">{orderCapacity}%</span>
              </div>
              <Progress value={orderCapacity} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Queue Length</p>
                <p className="text-lg font-bold">{kitchenQueue?.activeOrders || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg Prep Time</p>
                <p className="text-lg font-bold">{kitchenQueue?.averagePrepTime || 0}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardStats?.topSellingItems && dashboardStats.topSellingItems.length > 0 ? (
              <div className="space-y-3">
                {dashboardStats.topSellingItems.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">{index + 1}</span>
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="outline">{item.quantity} sold</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Updates Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span>📊 Dashboard stats updated</span>
              <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
            </div>
            {kitchenQueue && (
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span>🍳 Kitchen queue: {kitchenQueue.activeOrders} active orders</span>
                <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>🔄 Auto-refresh in {Math.round(refreshInterval / 1000)}s</span>
              <span className="text-gray-500">Continuous</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
