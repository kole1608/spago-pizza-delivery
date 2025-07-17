'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ProductGridSkeleton } from '@/components/ui/loading-skeleton'
import { Search, Plus, Heart, Star } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Mock menu data
const mockMenuItems = [
  {
    id: '1',
    name: 'Margherita',
    description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
    price: 15.00,
    image: '🍕',
    category: 'Pizza',
    isVegetarian: true,
    isVegan: false,
    rating: 4.8,
    reviewCount: 124,
    preparationTime: '15-20 min',
    calories: 280,
    ingredients: ['Tomato sauce', 'Mozzarella', 'Fresh basil', 'Olive oil'],
    allergens: ['Gluten', 'Dairy'],
    size: 'Large'
  },
  {
    id: '2',
    name: 'Pepperoni',
    description: 'Classic pepperoni pizza with mozzarella and tomato sauce',
    price: 18.00,
    image: '🍕',
    category: 'Pizza',
    isVegetarian: false,
    isVegan: false,
    rating: 4.7,
    reviewCount: 98,
    preparationTime: '15-20 min',
    calories: 320,
    ingredients: ['Tomato sauce', 'Mozzarella', 'Pepperoni'],
    allergens: ['Gluten', 'Dairy'],
    size: 'Large'
  },
  {
    id: '3',
    name: 'Quattro Stagioni',
    description: 'Four seasons pizza with ham, mushrooms, artichokes, and olives',
    price: 22.00,
    image: '🍕',
    category: 'Pizza',
    isVegetarian: false,
    isVegan: false,
    rating: 4.6,
    reviewCount: 76,
    preparationTime: '18-22 min',
    calories: 340,
    ingredients: ['Tomato sauce', 'Mozzarella', 'Ham', 'Mushrooms', 'Artichokes', 'Olives'],
    allergens: ['Gluten', 'Dairy'],
    size: 'Large'
  },
  {
    id: '4',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan, croutons, and caesar dressing',
    price: 12.00,
    image: '🥗',
    category: 'Salads',
    isVegetarian: true,
    isVegan: false,
    rating: 4.5,
    reviewCount: 52,
    preparationTime: '5-8 min',
    calories: 180,
    ingredients: ['Romaine lettuce', 'Parmesan', 'Croutons', 'Caesar dressing'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    size: 'Regular'
  },
  {
    id: '5',
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with eggs, pancetta, and parmesan',
    price: 16.00,
    image: '🍝',
    category: 'Pasta',
    isVegetarian: false,
    isVegan: false,
    rating: 4.9,
    reviewCount: 134,
    preparationTime: '12-15 min',
    calories: 420,
    ingredients: ['Spaghetti', 'Eggs', 'Pancetta', 'Parmesan', 'Black pepper'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    size: 'Regular'
  },
  {
    id: '6',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
    price: 8.00,
    image: '🍰',
    category: 'Desserts',
    isVegetarian: true,
    isVegan: false,
    rating: 4.8,
    reviewCount: 89,
    preparationTime: 'Ready to serve',
    calories: 240,
    ingredients: ['Ladyfingers', 'Coffee', 'Mascarpone', 'Cocoa powder'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    size: 'Regular'
  },
  {
    id: '7',
    name: 'Coca Cola',
    description: 'Classic Coca Cola 500ml bottle',
    price: 2.50,
    image: '🥤',
    category: 'Beverages',
    isVegetarian: true,
    isVegan: true,
    rating: 4.3,
    reviewCount: 45,
    preparationTime: 'Ready to serve',
    calories: 210,
    ingredients: ['Carbonated water', 'Sugar', 'Natural flavors'],
    allergens: [],
    size: '500ml'
  },
  {
    id: '8',
    name: 'Hawaiian',
    description: 'Tropical pizza with ham, pineapple, and mozzarella',
    price: 19.00,
    image: '🍕',
    category: 'Pizza',
    isVegetarian: false,
    isVegan: false,
    rating: 4.2,
    reviewCount: 67,
    preparationTime: '15-20 min',
    calories: 300,
    ingredients: ['Tomato sauce', 'Mozzarella', 'Ham', 'Pineapple'],
    allergens: ['Gluten', 'Dairy'],
    size: 'Large'
  }
]

const categories = ['All', 'Pizza', 'Pasta', 'Salads', 'Desserts', 'Beverages']

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredItems = mockMenuItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const addToCart = (item: typeof mockMenuItems[0]) => {
    // In real app, this would call cart store
    console.log('Adding to cart:', item.name)
    // Show toast notification
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <ProductGridSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Menu</h1>
          <p className="text-gray-600">
            Discover our delicious selection of Italian cuisine
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="p-0">
                  <div className="relative bg-gradient-to-br from-orange-100 to-orange-200 h-48 flex items-center justify-center">
                    <div className="text-6xl">{item.image}</div>
                    
                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => toggleFavorite(item.id)}
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          favorites.includes(item.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </Button>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 space-y-1">
                      {item.isVegetarian && (
                        <Badge className="bg-green-100 text-green-800">Vegetarian</Badge>
                      )}
                      {item.isVegan && (
                        <Badge className="bg-green-100 text-green-800">Vegan</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="mb-2">
                    <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{item.rating}</span>
                      <span className="text-xs text-gray-500">({item.reviewCount})</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.preparationTime}</span>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Size: {item.size}</span>
                      <span>{item.calories} cal</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-orange-600">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => addToCart(item)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 