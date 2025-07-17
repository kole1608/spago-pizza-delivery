'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { ShoppingCart, Users, DollarSign, TrendingUp, Package, Clock } from 'lucide-react'

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [, setDashboardData] = useState<Record<string, unknown> | null>(null)

  // Mock dashboard data
  const mockData = {
    todayStats: {
      orders: 42,
      revenue: 1247.50,
      customers: 28,
      avgOrderValue: 29.70
    },
    recentOrders: [
      { id: '1', customer: 'John Doe', total: 45.99, status: 'preparing', time: '10:30 AM' },
      { id: '2', customer: 'Jane Smith', total: 32.50, status: 'delivered', time: '10:15 AM' },
      { id: '3', customer: 'Bob Johnson', total: 67.25, status: 'out_for_delivery', time: '10:00 AM' },
    ],
    kitchenQueue: [
      { id: '1', items: 'Margherita x2, Pepperoni x1', estimatedTime: '15 min', priority: 'high' },
      { id: '2', items: 'Hawaiian x1, Caesar Salad x1', estimatedTime: '20 min', priority: 'normal' },
      { id: '3', items: 'Quattro Stagioni x1', estimatedTime: '25 min', priority: 'normal' },
    ],
    deliveryDrivers: [
      { id: '1', name: 'Mike Wilson', status: 'delivering', orders: 2, eta: '15 min' },
      { id: '2', name: 'Sarah Connor', status: 'available', orders: 0, eta: null },
      { id: '3', name: 'Tom Brady', status: 'returning', orders: 1, eta: '10 min' },
    ]
  }

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setDashboardData(mockData)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [mockData])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'bg-orange-100 text-orange-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800'
      case 'delivering':
        return 'bg-blue-100 text-blue-800'
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'returning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor your restaurant operations in real-time</p>
        </div>
        <Button>
          View Reports
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.todayStats.orders}</div>
            <p className="text-xs text-muted-foreground">
              +20% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockData.todayStats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +15% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.todayStats.customers}</div>
            <p className="text-xs text-muted-foreground">
              +5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockData.todayStats.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="kitchen">Kitchen Queue</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Status</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-sm text-gray-600">Order #{order.id} • {order.time}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                      <p className="font-semibold">${order.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kitchen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Kitchen Queue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.kitchenQueue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{item.items}</p>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{item.estimatedTime}</span>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.deliveryDrivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-gray-600">
                        {driver.orders} active orders
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(driver.status)}>
                        {driver.status}
                      </Badge>
                      {driver.eta && (
                        <span className="text-sm text-gray-600">ETA: {driver.eta}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 