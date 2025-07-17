'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, MapPin, CreditCard, Check, Lock, Loader2 } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCartStore } from '@/stores/cart-store'
import { cn } from '@/lib/utils'

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  zipCode: z.string().min(5, 'Valid zip code is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  instructions: z.string().optional(),
})

const paymentSchema = z.object({
  cardNumber: z.string().min(16, 'Valid card number is required'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Valid expiry date required (MM/YY)'),
  cvv: z.string().min(3, 'Valid CVV is required'),
  cardholderName: z.string().min(2, 'Cardholder name is required'),
})

type AddressForm = z.infer<typeof addressSchema>
type PaymentForm = z.infer<typeof paymentSchema>

const steps = [
  { id: 'address', title: 'Delivery Address', icon: MapPin },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'confirmation', title: 'Confirmation', icon: Check },
]

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState('address')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  
  const { 
    items, 
    getSubtotal, 
    getDeliveryFee, 
    getTax, 
    getTotal,
    clearCart 
  } = useCartStore()

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: session?.user?.name || '',
      street: '',
      city: '',
      zipCode: '',
      phone: '',
      instructions: '',
    },
  })

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: session?.user?.name || '',
    },
  })

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">
              You need items in your cart before you can checkout.
            </p>
            <Button asChild>
              <Link href="/menu">Browse Menu</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleAddressSubmit = (data: AddressForm) => {
    console.log('Address data:', data)
    setCurrentStep('payment')
  }

  const handlePaymentSubmit = async (data: PaymentForm) => {
    setIsSubmitting(true)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real app, this would call your payment API
      console.log('Payment data:', data)
      
      setCurrentStep('confirmation')
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrderComplete = () => {
    // Clear cart and redirect to order confirmation
    clearCart()
    router.push('/orders/confirmation')
  }

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const subtotal = getSubtotal()
  const deliveryFee = getDeliveryFee()
  const tax = getTax()
  const total = getTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="pl-0 mb-4">
            <Link href="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    index <= currentStepIndex
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'ml-2 text-sm font-medium',
                    index <= currentStepIndex ? 'text-orange-600' : 'text-gray-400'
                  )}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-12 h-px mx-4',
                      index < currentStepIndex ? 'bg-orange-600' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Address Step */}
            {currentStep === 'address' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          {...addressForm.register('name')}
                          className={addressForm.formState.errors.name ? 'border-red-500' : ''}
                        />
                        {addressForm.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {addressForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...addressForm.register('phone')}
                          className={addressForm.formState.errors.phone ? 'border-red-500' : ''}
                        />
                        {addressForm.formState.errors.phone && (
                          <p className="text-sm text-red-600 mt-1">
                            {addressForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        {...addressForm.register('street')}
                        placeholder="123 Main Street, Apt 4B"
                        className={addressForm.formState.errors.street ? 'border-red-500' : ''}
                      />
                      {addressForm.formState.errors.street && (
                        <p className="text-sm text-red-600 mt-1">
                          {addressForm.formState.errors.street.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...addressForm.register('city')}
                          className={addressForm.formState.errors.city ? 'border-red-500' : ''}
                        />
                        {addressForm.formState.errors.city && (
                          <p className="text-sm text-red-600 mt-1">
                            {addressForm.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          {...addressForm.register('zipCode')}
                          className={addressForm.formState.errors.zipCode ? 'border-red-500' : ''}
                        />
                        {addressForm.formState.errors.zipCode && (
                          <p className="text-sm text-red-600 mt-1">
                            {addressForm.formState.errors.zipCode.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                      <Textarea
                        id="instructions"
                        {...addressForm.register('instructions')}
                        placeholder="Ring the bell, leave at door, etc."
                        className="min-h-20"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <Label className="text-base font-medium">Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center cursor-pointer">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="cursor-pointer">
                          💵 Cash on Delivery
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === 'card' && (
                    <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          {...paymentForm.register('cardholderName')}
                          className={paymentForm.formState.errors.cardholderName ? 'border-red-500' : ''}
                        />
                        {paymentForm.formState.errors.cardholderName && (
                          <p className="text-sm text-red-600 mt-1">
                            {paymentForm.formState.errors.cardholderName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          {...paymentForm.register('cardNumber')}
                          className={paymentForm.formState.errors.cardNumber ? 'border-red-500' : ''}
                        />
                        {paymentForm.formState.errors.cardNumber && (
                          <p className="text-sm text-red-600 mt-1">
                            {paymentForm.formState.errors.cardNumber.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            {...paymentForm.register('expiryDate')}
                            className={paymentForm.formState.errors.expiryDate ? 'border-red-500' : ''}
                          />
                          {paymentForm.formState.errors.expiryDate && (
                            <p className="text-sm text-red-600 mt-1">
                              {paymentForm.formState.errors.expiryDate.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            {...paymentForm.register('cvv')}
                            className={paymentForm.formState.errors.cvv ? 'border-red-500' : ''}
                          />
                          {paymentForm.formState.errors.cvv && (
                            <p className="text-sm text-red-600 mt-1">
                              {paymentForm.formState.errors.cvv.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <Alert>
                        <Lock className="h-4 w-4" />
                        <AlertDescription>
                          Your payment information is secure and encrypted.
                        </AlertDescription>
                      </Alert>

                      <div className="flex space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep('address')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Place Order'
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertDescription>
                          You have selected Cash on Delivery. Please have the exact amount ready when your order arrives.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep('address')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setCurrentStep('confirmation')}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          Place Order
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Confirmation Step */}
            {currentStep === 'confirmation' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-600" />
                    Order Confirmed!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Thank you for your order!
                    </h3>
                    <p className="text-gray-600">
                      Your order has been successfully placed and is being prepared.
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Order Number:</strong> #SP{Date.now().toString().slice(-6)}</p>
                    <p><strong>Estimated Delivery:</strong> 25-35 minutes</p>
                    <p><strong>Payment Method:</strong> {paymentMethod === 'card' ? 'Card' : 'Cash on Delivery'}</p>
                  </div>

                  <Button
                    onClick={handleOrderComplete}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Track Your Order
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1 pr-2">
                        <span className="font-medium">{item.quantity}× {item.name}</span>
                        {item.size && (
                          <span className="text-gray-500"> ({item.size.name})</span>
                        )}
                      </div>
                      <span className="font-medium">
                        €{((item.basePrice + (item.size?.price || 0) + 
                           item.toppings.reduce((sum, t) => sum + t.price, 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>€{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (20%)</span>
                    <span>€{tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">€{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 