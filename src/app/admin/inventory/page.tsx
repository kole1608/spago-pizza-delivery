'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ShoppingCart,
  Truck,
  Clock,
  DollarSign
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Mock inventory data
const mockInventoryItems = [
  {
    id: '1',
    name: 'Pizza Dough',
    category: 'Ingredients',
    currentStock: 25,
    minimumStock: 10,
    maximumStock: 50,
    unit: 'kg',
    costPerUnit: 2.50,
    supplier: 'Local Bakery',
    lastRestocked: '2024-01-18',
    expiryDate: '2024-01-25',
    status: 'in_stock'
  },
  {
    id: '2',
    name: 'Mozzarella Cheese',
    category: 'Ingredients',
    currentStock: 8,
    minimumStock: 15,
    maximumStock: 40,
    unit: 'kg',
    costPerUnit: 8.00,
    supplier: 'Dairy Farm Co.',
    lastRestocked: '2024-01-17',
    expiryDate: '2024-01-24',
    status: 'low_stock'
  },
  {
    id: '3',
    name: 'Tomato Sauce',
    category: 'Ingredients',
    currentStock: 30,
    minimumStock: 20,
    maximumStock: 60,
    unit: 'liters',
    costPerUnit: 3.20,
    supplier: 'Fresh Foods Ltd',
    lastRestocked: '2024-01-19',
    expiryDate: '2024-02-15',
    status: 'in_stock'
  },
  {
    id: '4',
    name: 'Pepperoni',
    category: 'Toppings',
    currentStock: 0,
    minimumStock: 5,
    maximumStock: 20,
    unit: 'kg',
    costPerUnit: 12.00,
    supplier: 'Meat Products Inc',
    lastRestocked: '2024-01-15',
    expiryDate: '2024-01-22',
    status: 'out_of_stock'
  },
  {
    id: '5',
    name: 'Fresh Basil',
    category: 'Toppings',
    currentStock: 12,
    minimumStock: 5,
    maximumStock: 25,
    unit: 'bunches',
    costPerUnit: 1.50,
    supplier: 'Herb Garden Co',
    lastRestocked: '2024-01-20',
    expiryDate: '2024-01-23',
    status: 'in_stock'
  }
]

const mockStats = {
  totalItems: 45,
  lowStockItems: 3,
  outOfStockItems: 1,
  totalValue: 2850.75,
  monthlyUsage: 1250.30,
  wastePercentage: 2.5
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredItems = mockInventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (item: typeof mockInventoryItems[0]) => {
    if (item.currentStock === 0) return 'out_of_stock'
    if (item.currentStock <= item.minimumStock) return 'low_stock'
    return 'in_stock'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800">In Stock</Badge>
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStockLevel = (current: number, minimum: number, maximum: number) => {
    const percentage = (current / maximum) * 100
    return Math.min(percentage, 100)
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your restaurant inventory</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mockStats.lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockStats.outOfStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.monthlyUsage.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waste %</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.wastePercentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search items or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white"
        >
          <option value="all">All Categories</option>
          <option value="ingredients">Ingredients</option>
          <option value="toppings">Toppings</option>
          <option value="beverages">Beverages</option>
          <option value="packaging">Packaging</option>
        </select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span>{item.currentStock} {item.unit}</span>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getStockStatus(item) === 'out_of_stock' ? 'bg-red-500' :
                            getStockStatus(item) === 'low_stock' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${getStockLevel(item.currentStock, item.minimumStock, item.maximumStock)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(getStockStatus(item))}</TableCell>
                  <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.expiryDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Truck className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 
