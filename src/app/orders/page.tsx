'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin,
  Phone,
  MessageCircle,
  Star,
  Filter,
  Search,
  Calendar,
  ArrowUpDown
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { OrdersSkeleton } from '@/components/ui/loading-skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Mock orders data
const mockOrders = [
  {
    id: 'SP123456',
    date: '2024-01-20T18:30:00Z',
    status: 'DELIVERED',
    total: 45.99,
    items: [
      { name: 'Margherita Pizza', quantity: 2, price: 15.00 },
      { name: 'Caesar Salad', quantity: 1, price: 12.00 },
      { name: 'Coca Cola', quantity: 1, price: 2.50 }
    ],
    deliveryAddress: '123 Main Street, Apt 4B, Belgrade',
    estimatedDelivery: '2024-01-20T19:15:00Z',
    actualDelivery: '2024-01-20T19:10:00Z',
    rating: 5,
    driverName: 'Mike Wilson',
    driverPhone: '+381 64 123 4567',
    restaurant: {
      name: 'Spago Pizza - Center',
      phone: '+381 11 123 4567'
    }
  },
  {
    id: 'SP123457',
    date: '2024-01-18T20:15:00Z',
    status: 'DELIVERED',
    total: 32.50,
    items: [
      { name: 'Pepperoni Pizza', quantity: 1, price: 18.00 },
      { name: 'Mineral Water', quantity: 2, price: 3.00 }
    ],
    deliveryAddress: '456 Business Ave, Office 12, Belgrade',
    estimatedDelivery: '2024-01-18T21:00:00Z',
    actualDelivery: '2024-01-18T20:55:00Z',
    rating: 4,
    driverName: 'Sarah Connor',
    driverPhone: '+381 64 234 5678',
    restaurant: {
      name: 'Spago Pizza - New Belgrade',
      phone: '+381 11 234 5678'
    }
  },
  {
    id: 'SP123458',
    date: '2024-01-15T19:45:00Z',
    status: 'OUT_FOR_DELIVERY',
    total: 67.25,
    items: [
      { name: 'Quattro Stagioni', quantity: 1, price: 22.00 },
      { name: 'Spaghetti Carbonara', quantity: 1, price: 16.00 },
      { name: 'Tiramisu', quantity: 2, price: 8.00 },
      { name: 'Wine', quantity: 1, price: 15.00 }
    ],
    deliveryAddress: '789 Residential Blvd, House 15, Belgrade',
    estimatedDelivery: '2024-01-15T20:30:00Z',
    driverName: 'Tom Brady',
    driverPhone: '+381 64 345 6789',
    restaurant: {
      name: 'Spago Pizza - Zemun',
      phone: '+381 11 345 6789'
    }
  },
  {
    id: 'SP123459',
    date: '2024-01-12T17:20:00Z',
    status: 'PREPARING',
    total: 28.75,
    items: [
      { name: 'Hawaiian Pizza', quantity: 1, price: 19.00 },
      { name: 'Fresh Orange Juice', quantity: 1, price: 4.50 }
    ],
    deliveryAddress: '321 Student Street, Dorm B, Room 205, Belgrade',
    estimatedDelivery: '2024-01-12T18:05:00Z',
    restaurant: {
      name: 'Spago Pizza - Center',
      phone: '+381 11 123 4567'
    }
  },
  {
    id: 'SP123460',
    date: '2024-01-10T21:00:00Z',
    status: 'CANCELLED',
    total: 41.20,
    items: [
      { name: 'Vegetarian Pizza', quantity: 1, price: 17.00 },
      { name: 'Greek Salad', quantity: 1, price: 11.00 },
      { name: 'Garlic Bread', quantity: 1, price: 5.50 },
      { name: 'Lemonade', quantity: 2, price: 3.85 }
    ],
    deliveryAddress: '987 Corporate Plaza, Floor 8, Belgrade',
    restaurant: {
      name: 'Spago Pizza - New Belgrade',
      phone: '+381 11 234 5678'
    }
  }
]

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState(mockOrders)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (status === 'loading' || isLoading) {
    return <OrdersSkeleton />
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.items.some(item => 
                             item.name.toLowerCase().includes(searchQuery.toLowerCase())
                           )
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'total-desc':
          return b.total - a.total
        case 'total-asc':
          return a.total - b.total
        default:
          return 0
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return <Clock className="h-4 w-4" />
      case 'OUT_FOR_DELIVERY':
        return <Truck className="h-4 w-4" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <ShoppingCart className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleReorder = (order: typeof mockOrders[0]) => {
    // In real app, this would add items to cart
    console.log('Reordering:', order.items)
    router.push('/menu')
  }

  const handleTrackOrder = (orderId: string) => {
    router.push(`/orders/${orderId}/track`)
  }

  const handleRateOrder = (orderId: string) => {
    // In real app, this would open rating modal
    console.log('Rating order:', orderId)
  }

  const handleContactDriver = (phone: string) => {
    window.open(`tel:${phone}`)
  }

  const handleContactRestaurant = (phone: string) => {
    window.open(`tel:${phone}`)
  }

  if (filteredOrders.length === 0 && searchQuery === '' && statusFilter === 'all') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">No orders yet</h1>
              <p className="text-gray-600">
                Looks like you haven&apos;t placed any orders yet.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/menu')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Browse Menu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
            <p className="text-gray-600">
              Track your current orders and view your order history
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders or items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="PREPARING">Preparing</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="total-desc">Highest Amount</SelectItem>
                  <SelectItem value="total-asc">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.replace('_', ' ')}</span>
                        </Badge>
                        <span className="text-lg font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="flex items-start space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Delivery Address</p>
                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          </div>
                        </div>
                        
                        {order.estimatedDelivery && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {order.status === 'DELIVERED' ? 'Delivered at' : 'Estimated delivery'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.actualDelivery || order.estimatedDelivery)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {order.driverName && (
                          <div>
                            <p className="text-sm font-medium">Driver: {order.driverName}</p>
                            {order.driverPhone && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContactDriver(order.driverPhone!)}
                                className="text-xs"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Call Driver
                              </Button>
                            )}
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium">Restaurant: {order.restaurant.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactRestaurant(order.restaurant.phone)}
                            className="text-xs"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call Restaurant
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {(order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrackOrder(order.id)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Track Order
                        </Button>
                      )}

                      {order.status === 'DELIVERED' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReorder(order)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Reorder
                          </Button>

                          {!order.rating && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRateOrder(order.id)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Rate Order
                            </Button>
                          )}

                          {order.rating && (
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-gray-600">Your rating:</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < order.rating! 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
