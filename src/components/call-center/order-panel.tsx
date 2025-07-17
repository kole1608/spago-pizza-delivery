'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Edit,
  CreditCard,
  Banknote,
  Truck,
  Clock,
  Check
} from 'lucide-react';
import type { OrderItem, Address, Customer } from '@/hooks/use-call-center';

interface OrderPanelProps {
  currentOrder: OrderItem[];
  customer: Customer | null;
  selectedAddress: Address | null;
  orderNotes: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  isProcessingOrder: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onEditItem: (item: OrderItem) => void;
  onSetNotes: (notes: string) => void;
  onSubmitOrder: () => Promise<any>;
  onClearOrder: () => void;
}

export function OrderPanel({
  currentOrder,
  customer,
  selectedAddress,
  orderNotes,
  subtotal,
  tax,
  deliveryFee,
  total,
  isProcessingOrder,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onSetNotes,
  onSubmitOrder,
  onClearOrder,
}: OrderPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getTotalPrepTime = () => {
    if (currentOrder.length === 0) return 0;
    return Math.max(...currentOrder.map(item => 15)); // Default 15min, would come from product data
  };

  const getItemTotal = (item: OrderItem) => {
    const customizationTotal = item.customizations.reduce((sum, custom) => sum + custom.price, 0);
    return (item.price + customizationTotal) * item.quantity;
  };

  const handleSubmitOrder = async () => {
    try {
      setShowOrderSummary(true);
      const result = await onSubmitOrder();
      // Handle success
      console.log('Order submitted:', result);
    } catch (error) {
      console.error('Order submission failed:', error);
      setShowOrderSummary(false);
    }
  };

  const canSubmitOrder = () => {
    return customer && selectedAddress && currentOrder.length > 0 && !isProcessingOrder;
  };

  return (
    <div className="space-y-4">
      {/* Order Items */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
              Current Order ({currentOrder.length})
            </CardTitle>
            {currentOrder.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearOrder}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentOrder.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No items in order</div>
              <div className="text-xs text-gray-400 mt-1">
                Add items from the menu to get started
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {currentOrder.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm text-gray-800">
                      {item.name}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditItem(item)}
                        className="p-1 h-auto text-blue-600"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 h-auto text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Customizations */}
                  {item.customizations.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2">
                      {item.customizations.map((custom, index) => (
                        <div key={index}>
                          + {custom.name} (+{formatPrice(custom.price)})
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="text-xs text-gray-600 mb-2 italic">
                      Note: {item.notes}
                    </div>
                  )}

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 h-6 w-6"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 h-6 w-6"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="font-semibold text-green-600">
                      {formatPrice(getItemTotal(item))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Notes */}
      {currentOrder.length > 0 && (
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Special instructions, allergies, delivery notes..."
              value={orderNotes}
              onChange={(e) => onSetNotes(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      {currentOrder.length > 0 && (
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Delivery Info */}
            {selectedAddress && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center text-sm font-medium text-blue-800 mb-1">
                  <Truck className="w-4 h-4 mr-1" />
                  Delivery Address
                </div>
                <div className="text-xs text-blue-700">
                  {selectedAddress.street}<br />
                  {selectedAddress.city}, {selectedAddress.postalCode}
                </div>
                {selectedAddress.instructions && (
                  <div className="text-xs text-blue-600 mt-1 italic">
                    "{selectedAddress.instructions}"
                  </div>
                )}
              </div>
            )}

            {/* Timing */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                Estimated Time
              </div>
              <div className="font-medium">{getTotalPrepTime()} minutes</div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Payment Method</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('CARD')}
                  className="flex items-center justify-center"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Card
                </Button>
                <Button
                  variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('CASH')}
                  className="flex items-center justify-center"
                >
                  <Banknote className="w-4 h-4 mr-1" />
                  Cash
                </Button>
              </div>
            </div>

            {/* Submit Order */}
            <div className="pt-2">
              <Button
                onClick={handleSubmitOrder}
                disabled={!canSubmitOrder()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isProcessingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing Order...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Submit Order ({formatPrice(total)})
                  </>
                )}
              </Button>
            </div>

            {/* Validation Messages */}
            {!customer && (
              <div className="text-xs text-red-600 text-center">
                Please select a customer to continue
              </div>
            )}
            {customer && !selectedAddress && (
              <div className="text-xs text-red-600 text-center">
                Please select a delivery address
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Success Modal */}
      {showOrderSummary && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-green-600 mb-2">
              <Check className="w-8 h-8 mx-auto" />
            </div>
            <div className="font-medium text-green-800 mb-1">
              Order Submitted Successfully!
            </div>
            <div className="text-sm text-green-700">
              Order has been sent to the kitchen
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 