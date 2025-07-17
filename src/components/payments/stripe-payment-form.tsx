'use client'

import { useState, useEffect } from 'react'
import { 
  useStripe, 
  useElements, 
  CardElement,
  PaymentRequestButtonElement,
  Elements
} from '@stripe/react-stripe-js'
import { loadStripe, StripeError } from '@stripe/stripe-js'
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Smartphone,
  Wallet
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface PaymentFormProps {
  amount: number
  currency?: string
  orderId: string
  customerInfo: {
    name: string
    email: string
    phone?: string
  }
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
  className?: string
}

interface SavedPaymentMethod {
  id: string
  last4: string
  brand: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

// Mock saved payment methods for demo
const mockSavedMethods: SavedPaymentMethod[] = [
  {
    id: 'pm_1234567890',
    last4: '4242',
    brand: 'visa',
    expMonth: 12,
    expYear: 2025,
    isDefault: true
  },
  {
    id: 'pm_0987654321',
    last4: '5555',
    brand: 'mastercard',
    expMonth: 8,
    expYear: 2026,
    isDefault: false
  }
]

function PaymentForm({ 
  amount, 
  currency = 'eur', 
  orderId, 
  customerInfo, 
  onSuccess, 
  onError,
  className 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'new' | 'saved' | 'apple_pay' | 'google_pay'>('new')
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string | null>(null)
  const [saveCard, setSaveCard] = useState(false)
  const [paymentRequest, setPaymentRequest] = useState<any>(null)

  // Create payment intent
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            orderId,
            customerInfo,
          }),
        })

        const data = await response.json()
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setPaymentError('Failed to initialize payment')
        }
      } catch (error) {
        setPaymentError('Failed to create payment intent')
      }
    }

    createPaymentIntent()
  }, [amount, currency, orderId, customerInfo])

  // Initialize payment request for Apple Pay / Google Pay
  useEffect(() => {
    if (!stripe) return

    const pr = stripe.paymentRequest({
      country: 'RS',
      currency: currency,
      total: {
        label: 'Spago Pizza Order',
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    })

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr)
      }
    })

    pr.on('paymentmethod', async (event) => {
      if (!clientSecret) return

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: event.paymentMethod.id,
      })

      if (error) {
        event.complete('fail')
        setPaymentError(error.message || 'Payment failed')
      } else {
        event.complete('success')
        onSuccess({ id: 'payment_intent_success' })
      }
    })
  }, [stripe, amount, currency, clientSecret, onSuccess])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Payment system not ready. Please try again.')
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      if (paymentMethod === 'saved' && selectedSavedMethod) {
        // Use saved payment method
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedSavedMethod,
        })

        if (error) {
          setPaymentError(error.message || 'Payment failed')
        } else {
          onSuccess(paymentIntent)
        }
      } else if (paymentMethod === 'new') {
        // Use new card
        const cardElement = elements.getElement(CardElement)
        
        if (!cardElement) {
          setPaymentError('Card information not found')
          return
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
            },
          },
          setup_future_usage: saveCard ? 'off_session' : undefined,
        })

        if (error) {
          setPaymentError(error.message || 'Payment failed')
        } else {
          onSuccess(paymentIntent)
        }
      }
    } catch (error) {
      setPaymentError('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardBrand = (brand: string) => {
    switch (brand) {
      case 'visa': return 'Visa'
      case 'mastercard': return 'Mastercard'
      case 'amex': return 'American Express'
      default: return brand.charAt(0).toUpperCase() + brand.slice(1)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-600" />
          Secure Payment
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>256-bit SSL encryption</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Amount */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Amount</span>
            <span className="text-2xl font-bold">€{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Apple Pay / Google Pay */}
        {paymentRequest && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="font-medium">Quick Payment</span>
            </div>
            <PaymentRequestButtonElement 
              options={{ paymentRequest }}
              className="mb-4"
            />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or pay with card</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Payment Method</Label>
          
          {/* Saved Payment Methods */}
          {mockSavedMethods.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Saved Cards</Label>
              {mockSavedMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={method.id}
                    name="paymentMethod"
                    value="saved"
                    checked={paymentMethod === 'saved' && selectedSavedMethod === method.id}
                    onChange={() => {
                      setPaymentMethod('saved')
                      setSelectedSavedMethod(method.id)
                    }}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {formatCardBrand(method.brand)} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </label>
                </div>
              ))}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or use new card</span>
                </div>
              </div>
            </div>
          )}

          {/* New Card */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="new-card"
                name="paymentMethod"
                value="new"
                checked={paymentMethod === 'new'}
                onChange={() => setPaymentMethod('new')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <Label htmlFor="new-card" className="cursor-pointer flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                New Card
              </Label>
            </div>

            {paymentMethod === 'new' && (
              <div className="space-y-4 ml-6">
                <div className="p-3 border rounded-lg">
                  <CardElement options={cardElementOptions} />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-card"
                    checked={saveCard}
                    onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                  />
                  <Label htmlFor="save-card" className="text-sm">
                    Save this card for future orders
                  </Label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!stripe || isProcessing || !clientSecret}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Pay €{amount.toFixed(2)}
            </div>
          )}
        </Button>

        {/* Security Info */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>PCI Compliant</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Your payment information is encrypted and secure
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Wrapper component with Stripe Elements provider
export function StripePaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
} 