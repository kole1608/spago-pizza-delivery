'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Star, Leaf, Flame, Plus, Minus, ShoppingCart } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useCartStore } from '@/stores/cart-store'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  basePrice: number
  image?: string
  category: {
    id: string
    name: string
    slug: string
  }
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isSpicy: boolean
  calories?: number
  prepTime: number
  sizes: Array<{
    id: string
    name: string
    price: number
    isDefault: boolean
  }>
  toppings?: Array<{
    id: string
    name: string
    price: number
    isVegetarian: boolean
    isVegan: boolean
  }>
  ingredients?: Array<{
    id: string
    name: string
    isRemovable: boolean
  }>
}

const mockProduct: Product = {
  id: '1',
  name: 'Margherita',
  slug: 'margherita',
  description: 'Our classic Margherita pizza features hand-stretched dough topped with San Marzano tomatoes, fresh mozzarella di bufala, and aromatic basil leaves. Drizzled with extra virgin olive oil and baked in our traditional wood-fired oven.',
  basePrice: 12.0,
  category: { id: '1', name: 'Pizza', slug: 'pizza' },
  isVegetarian: true,
  isVegan: false,
  isGlutenFree: false,
  isSpicy: false,
  calories: 280,
  prepTime: 15,
  sizes: [
    { id: '1', name: 'Small (25cm)', price: 0, isDefault: true },
    { id: '2', name: 'Medium (30cm)', price: 4, isDefault: false },
    { id: '3', name: 'Large (35cm)', price: 8, isDefault: false },
  ],
  toppings: [
    { id: '1', name: 'Extra Mozzarella', price: 2.0, isVegetarian: true, isVegan: false },
    { id: '2', name: 'Pepperoni', price: 3.0, isVegetarian: false, isVegan: false },
    { id: '3', name: 'Mushrooms', price: 1.5, isVegetarian: true, isVegan: true },
    { id: '4', name: 'Bell Peppers', price: 1.5, isVegetarian: true, isVegan: true },
    { id: '5', name: 'Red Onions', price: 1.0, isVegetarian: true, isVegan: true },
    { id: '6', name: 'Italian Sausage', price: 3.5, isVegetarian: false, isVegan: false },
    { id: '7', name: 'Fresh Basil', price: 1.0, isVegetarian: true, isVegan: true },
    { id: '8', name: 'Black Olives', price: 2.0, isVegetarian: true, isVegan: true },
  ],
  ingredients: [
    { id: '1', name: 'Tomato Sauce', isRemovable: true },
    { id: '2', name: 'Mozzarella Cheese', isRemovable: false },
    { id: '3', name: 'Fresh Basil', isRemovable: true },
    { id: '4', name: 'Olive Oil', isRemovable: true },
  ],
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState(mockProduct.sizes.find(s => s.isDefault)?.id || mockProduct.sizes[0]?.id)
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')

  const { addItem } = useCartStore()

  // In a real app, you would fetch the product based on params.slug
  const product = mockProduct

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
            <Button asChild>
              <Link href="/menu">Back to Menu</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const selectedSizeObj = product.sizes.find(s => s.id === selectedSize)
  const toppingsPrice = selectedToppings.reduce((total, toppingId) => {
    const topping = product.toppings?.find(t => t.id === toppingId)
    return total + (topping?.price || 0)
  }, 0)

  const totalPrice = (product.basePrice + (selectedSizeObj?.price || 0) + toppingsPrice) * quantity

  const handleToppingChange = (toppingId: string) => {
    setSelectedToppings(prev => 
      prev.includes(toppingId) 
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    )
  }

  const handleIngredientRemove = (ingredientId: string) => {
    setRemovedIngredients(prev => 
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    )
  }

  const handleAddToCart = () => {
    const selectedSizeInfo = product.sizes.find(s => s.id === selectedSize)
    const selectedToppingsInfo = product.toppings?.filter(t => selectedToppings.includes(t.id)) || []
    
    addItem({
      id: `${product.id}-${selectedSize}-${selectedToppings.join(',')}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: totalPrice / quantity,
      quantity,
      image: product.image,
      size: selectedSizeInfo?.name,
      sizeId: selectedSize,
      toppings: selectedToppingsInfo.map(t => ({ id: t.id, name: t.name, price: t.price })),
      removedIngredients: product.ingredients?.filter(i => removedIngredients.includes(i.id)).map(i => ({ id: i.id, name: i.name })) || [],
      specialInstructions: specialInstructions || undefined,
    })

    // Show success message or redirect
    router.push('/cart')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/menu" className="hover:text-orange-600">Menu</Link>
            <span>/</span>
            <Link href={`/menu?category=${product.category.slug}`} className="hover:text-orange-600">
              {product.category.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 pl-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg flex items-center justify-center">
              <div className="text-8xl">🍕</div>
              
              {/* Dietary badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {product.isVegetarian && (
                  <Badge className="bg-green-100 text-green-800">
                    <Leaf className="h-3 w-3 mr-1" />
                    Vegetarian
                  </Badge>
                )}
                {product.isVegan && (
                  <Badge className="bg-green-100 text-green-800">
                    Vegan
                  </Badge>
                )}
                {product.isSpicy && (
                  <Badge className="bg-red-100 text-red-800">
                    <Flame className="h-3 w-3 mr-1" />
                    Spicy
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <Badge variant="outline" className="mb-4">{product.category.name}</Badge>
              <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Product Info */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {product.prepTime} min
              </div>
              {product.calories && (
                <div>{product.calories} cal</div>
              )}
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                4.8 (124 reviews)
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Choose Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                    <div className="space-y-3">
                      {product.sizes.map((size) => (
                        <div key={size.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={size.id} id={size.id} />
                            <Label htmlFor={size.id} className="cursor-pointer">
                              {size.name}
                            </Label>
                          </div>
                          <span className="font-medium">
                            +€{size.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Extra Toppings */}
            {product.toppings && product.toppings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Extra Toppings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {product.toppings.map((topping) => (
                      <div key={topping.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={topping.id}
                            checked={selectedToppings.includes(topping.id)}
                            onCheckedChange={() => handleToppingChange(topping.id)}
                          />
                          <Label htmlFor={topping.id} className="cursor-pointer flex items-center">
                            {topping.name}
                            {topping.isVegetarian && (
                              <Leaf className="h-3 w-3 ml-1 text-green-600" />
                            )}
                          </Label>
                        </div>
                        <span className="font-medium">+€{topping.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Remove Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customize Ingredients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {product.ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`remove-${ingredient.id}`}
                            checked={removedIngredients.includes(ingredient.id)}
                            onCheckedChange={() => handleIngredientRemove(ingredient.id)}
                            disabled={!ingredient.isRemovable}
                          />
                          <Label 
                            htmlFor={`remove-${ingredient.id}`} 
                            className={cn(
                              "cursor-pointer",
                              !ingredient.isRemovable && "text-gray-400 cursor-not-allowed"
                            )}
                          >
                            Remove {ingredient.name}
                          </Label>
                        </div>
                        {!ingredient.isRemovable && (
                          <span className="text-xs text-gray-500">Required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any special requests or cooking instructions..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="min-h-20"
                />
              </CardContent>
            </Card>

            {/* Quantity and Add to Cart */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Quantity</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base price</span>
                      <span>€{product.basePrice.toFixed(2)}</span>
                    </div>
                    {selectedSizeObj && selectedSizeObj.price > 0 && (
                      <div className="flex justify-between">
                        <span>Size ({selectedSizeObj.name})</span>
                        <span>+€{selectedSizeObj.price.toFixed(2)}</span>
                      </div>
                    )}
                    {toppingsPrice > 0 && (
                      <div className="flex justify-between">
                        <span>Extra toppings</span>
                        <span>+€{toppingsPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {quantity > 1 && (
                      <div className="flex justify-between">
                        <span>Quantity (×{quantity})</span>
                        <span>×{quantity}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-orange-600">€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-lg h-12"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart - €{totalPrice.toFixed(2)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        <Card>
          <CardHeader>
            <CardTitle>You might also like</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mock related products */}
              {[
                { name: 'Pepperoni', price: 15.0 },
                { name: 'Quattro Stagioni', price: 18.0 },
                { name: 'Vegetarian Supreme', price: 17.0 },
              ].map((item, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="h-32 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg mb-3 flex items-center justify-center">
                    <div className="text-3xl">🍕</div>
                  </div>
                  <h3 className="font-medium mb-2">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-600">€{item.price.toFixed(2)}</span>
                    <Button size="sm" variant="outline">
                      Quick Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
} 