'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CartSkeleton } from '@/components/ui/loading-skeleton'
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, MapPin } from 'lucide-react'

// Mock cart data
const mockCartItems = [
  {
    id: '1',
    name: 'Margherita Pizza',
    price: 15.00,
    quantity: 2,
    image: '🍕',
    description: 'Classic tomato sauce, mozzarella, fresh basil',
    category: 'Pizza',
    size: 'Large'
  },
  {
    id: '2', 
    name: 'Caesar Salad',
    price: 12.00,
    quantity: 1,
    image: '🥗',
    description: 'Crisp romaine lettuce, parmesan, croutons, caesar dressing',
    category: 'Salads',
    size: 'Regular'
  },
  {
    id: '3',
    name: 'Coca Cola',
    price: 2.50,
    quantity: 2,
    image: '🥤',
    description: '500ml bottle',
    category: 'Beverages',
    size: 'Regular'
  }
]

export default function CartPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [isLoading, setIsLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)

  if (status === 'loading') {
    return <CartSkeleton />
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId)
      return
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  const applyPromoCode = () => {
    // Mock promo code logic
    if (promoCode.toLowerCase() === 'save10') {
      setDiscount(0.10) // 10% discount
    } else if (promoCode.toLowerCase() === 'welcome20') {
      setDiscount(0.20) // 20% discount
    } else {
      setDiscount(0)
      alert('Invalid promo code')
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = subtotal * discount
  const deliveryFee = subtotal > 25 ? 0 : 3.99
  const total = subtotal - discountAmount + deliveryFee

  const handleCheckout = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Redirect to checkout
    router.push('/checkout')
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
              <p className="text-gray-600">
                Looks like you haven&apos;t added anything to your cart yet.
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{item.image}</div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">{item.size}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-semibold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle>Promo Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button variant="outline" onClick={applyPromoCode}>
                      Apply
                    </Button>
                  </div>
                  {discount > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      {Math.round(discount * 100)}% discount applied!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({Math.round(discount * 100)}%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  
                  {deliveryFee === 0 && (
                    <p className="text-sm text-green-600">
                      🎉 Free delivery on orders over $25
                    </p>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Delivery Address</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p className="font-medium">Home</p>
                    <p className="text-gray-600">123 Main Street, Apt 4B</p>
                    <p className="text-gray-600">Belgrade, Serbia</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    Change Address
                  </Button>
                </CardContent>
              </Card>

              {/* Checkout Button */}
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Proceed to Checkout</span>
                  </div>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By proceeding, you agree to our Terms & Conditions and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 