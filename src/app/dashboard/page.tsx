'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { 
  ShoppingCart, 
  Package, 
  MapPin,
  Heart,
  Gift
} from 'lucide-react'

// Mock data - in real app this would come from API/tRPC
const mockUserStats = {
  totalOrders: 12,
  recentOrders: [
    {
      id: 'SP123456',
      date: '2024-01-20',
      total: 45.99,
      status: 'DELIVERED',
      items: [
        { name: 'Margherita Pizza', quantity: 2, price: 15.00 },
        { name: 'Coca Cola', quantity: 1, price: 2.50 }
      ]
    },
    {
      id: 'SP123457', 
      date: '2024-01-18',
      total: 28.00,
      status: 'DELIVERED',
      items: [
        { name: 'Caesar Salad', quantity: 1, price: 12.00 },
        { name: 'Mineral Water', quantity: 2, price: 3.00 }
      ]
    },
    {
      id: 'SP123458',
      date: '2024-01-15',
      total: 55.75,
      status: 'CANCELLED',
      items: [
        { name: 'Quattro Stagioni', quantity: 1, price: 18.00 },
        { name: 'Spaghetti Carbonara', quantity: 1, price: 14.00 }
      ]
    }
  ],
  loyaltyPoints: 245,
  tier: 'Silver',
  nextTier: 'Gold',
  pointsToNextTier: 255,
  favoriteItems: [
    { name: 'Margherita Pizza', orders: 8 },
    { name: 'Caesar Salad', orders: 5 },
    { name: 'Pepperoni Pizza', orders: 3 }
  ]
}

export default function Dashboard() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // In real app, fetch user specific data here
  }, [])

  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  if (!session) {
    return <div>Please sign in to view your dashboard.</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierProgress = () => {
    const totalRequired = mockUserStats.loyaltyPoints + mockUserStats.pointsToNextTier
    return (mockUserStats.loyaltyPoints / totalRequired) * 100
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your orders and rewards
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime orders placed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserStats.loyaltyPoints}</div>
              <p className="text-xs text-muted-foreground">
                {mockUserStats.pointsToNextTier} points to {mockUserStats.nextTier}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Tier</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserStats.tier}</div>
              <div className="mt-2">
                <Progress value={getTierProgress()} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUserStats.recentOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <p className="text-sm font-semibold mt-1">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {order.status === 'DELIVERED' && (
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Favorite Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUserStats.favoriteItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Heart className="h-5 w-5 text-red-500 fill-current" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">Ordered {item.orders} times</p>
                        </div>
                      </div>
                      <Button size="sm">
                        Order Again
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Tier Status */}
                  <div className="text-center p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    <h3 className="text-lg font-semibold mb-2">{mockUserStats.tier} Member</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      You have {mockUserStats.loyaltyPoints} points
                    </p>
                    <Progress value={getTierProgress()} className="h-3 mb-2" />
                    <p className="text-xs text-gray-500">
                      {mockUserStats.pointsToNextTier} more points to reach {mockUserStats.nextTier}
                    </p>
                  </div>

                  {/* Available Rewards */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Available Rewards</h4>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Free Pizza</p>
                          <p className="text-sm text-gray-600">Redeem for any medium pizza</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">500 points</p>
                          <Button size="sm" disabled>
                            Need 255 more
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Free Delivery</p>
                          <p className="text-sm text-gray-600">Free delivery on your next order</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">100 points</p>
                          <Button size="sm">
                            Redeem
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">20% Off</p>
                          <p className="text-sm text-gray-600">20% off your entire order</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">200 points</p>
                          <Button size="sm">
                            Redeem
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Quick Order</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Order your favorites with one click
              </p>
              <Button className="w-full">
                Browse Menu
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Track Order</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Track your current order in real-time
              </p>
              <Button variant="outline" className="w-full" disabled>
                No Active Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
