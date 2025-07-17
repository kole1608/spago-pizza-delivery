'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Headphones, 
  Settings, 
  HelpCircle,
  Monitor,
  Maximize2,
  Bell,
  BellOff
} from 'lucide-react';

// Import our components
import { useCallCenter } from '@/hooks/use-call-center';
import { CallTimer } from '@/components/call-center/call-timer';
import { CustomerSearch } from '@/components/call-center/customer-search';
import { MenuGrid } from '@/components/call-center/menu-grid';
import { OrderPanel } from '@/components/call-center/order-panel';
import type { Product, Customization } from '@/hooks/use-call-center';

export default function CallCenterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Call center state
  const {
    // Customer data
    currentCustomer,
    searchQuery,
    searchResults,
    isSearching,
    selectedAddress,
    showCustomerHistory,

    // Order data
    currentOrder,
    orderNotes,
    subtotal,
    tax,
    deliveryFee,
    total,
    isProcessingOrder,

    // Call data
    callStartTime,
    callDuration,
    operatorId,
    isOnCall,
    callStatus,

    // Products
    products,
    categories,
    quickAccessItems,

    // UI state
    selectedProduct,
    showCustomizationModal,

    // Actions
    searchCustomers,
    selectCustomer,
    startCall,
    endCall,
    holdCall,
    addToOrder,
    removeFromOrder,
    updateOrderItem,
    clearOrder,
    submitOrder,
    openCustomization,
    closeCustomization,
    toggleCustomerHistory,
    setOrderNotes,
    setSelectedAddress,
  } = useCallCenter();

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            document.getElementById('customer-search')?.focus();
            break;
          case 'n':
            e.preventDefault();
            if (currentCustomer && currentOrder.length > 0) {
              submitOrder();
            }
            break;
          case 'h':
            e.preventDefault();
            if (isOnCall) {
              holdCall();
            }
            break;
          case 'Enter':
            if (e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCustomer, currentOrder, isOnCall, submitOrder, holdCall]);

  const handleQuickAdd = useCallback((product: Product) => {
    if (product.customizations.length > 0) {
      openCustomization(product);
    } else {
      addToOrder(product, [], 1);
    }
  }, [addToOrder, openCustomization]);

  const handleCustomizationSubmit = useCallback((product: Product, customizations: Customization[], quantity: number) => {
    addToOrder(product, customizations, quantity);
    closeCustomization();
  }, [addToOrder, closeCustomization]);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    updateOrderItem(itemId, { quantity });
  }, [updateOrderItem]);

  const handleEditItem = useCallback((item: any) => {
    // Open customization modal for editing
    const product = products.find(p => p.id === item.productId);
    if (product) {
      openCustomization(product);
    }
  }, [products, openCustomization]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading call center...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Headphones className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">
                Spago Pizza - Call Center
              </h1>
            </div>
            <Badge className={`${isOnCall ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
              {isOnCall ? 'On Call' : 'Ready'}
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotifications(!notifications)}
              className="text-white hover:bg-white/20"
            >
              {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <div className="text-white text-sm">
              <div className="font-medium">{session.user?.name || 'Operator'}</div>
              <div className="text-xs opacity-80">{operatorId}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Customer Search & Call Timer */}
        <div className="w-80 p-4 space-y-4 overflow-y-auto">
          <CallTimer
            isOnCall={isOnCall}
            callDuration={callDuration}
            callStatus={callStatus}
            operatorId={operatorId}
            onStartCall={startCall}
            onEndCall={endCall}
            onHoldCall={holdCall}
            customerName={currentCustomer?.name}
            customerPhone={currentCustomer?.phone}
          />

          <CustomerSearch
            searchQuery={searchQuery}
            searchResults={searchResults}
            currentCustomer={currentCustomer}
            selectedAddress={selectedAddress}
            isSearching={isSearching}
            showCustomerHistory={showCustomerHistory}
            onSearch={searchCustomers}
            onSelectCustomer={selectCustomer}
            onSelectAddress={setSelectedAddress}
            onToggleHistory={toggleCustomerHistory}
            onCreateNewCustomer={() => {
              // Handle create new customer
              console.log('Create new customer');
            }}
          />
        </div>

        {/* Center - Menu Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <MenuGrid
            products={products}
            categories={categories}
            quickAccessItems={quickAccessItems}
            onSelectProduct={openCustomization}
            onQuickAdd={handleQuickAdd}
          />
        </div>

        {/* Right Sidebar - Order Panel */}
        <div className="w-96 p-4 overflow-y-auto">
          <OrderPanel
            currentOrder={currentOrder}
            customer={currentCustomer}
            selectedAddress={selectedAddress}
            orderNotes={orderNotes}
            subtotal={subtotal}
            tax={tax}
            deliveryFee={deliveryFee}
            total={total}
            isProcessingOrder={isProcessingOrder}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={removeFromOrder}
            onEditItem={handleEditItem}
            onSetNotes={setOrderNotes}
            onSubmitOrder={submitOrder}
            onClearOrder={clearOrder}
          />
        </div>
      </div>

      {/* Product Customization Modal */}
      <Dialog open={showCustomizationModal} onOpenChange={closeCustomization}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {selectedProduct.description}
              </div>
              
              <div className="text-lg font-semibold text-green-600">
                ${selectedProduct.price.toFixed(2)}
              </div>

              {/* Customization options would go here */}
              <div className="space-y-3">
                {selectedProduct.customizations.map((customization) => (
                  <div key={customization.id}>
                    <div className="font-medium text-sm mb-2">
                      {customization.name}
                      {customization.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    
                    <div className="space-y-2">
                      {customization.options.map((option) => (
                        <label 
                          key={option.id}
                          className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            <input
                              type={customization.type === 'SIZE' ? 'radio' : 'checkbox'}
                              name={customization.id}
                              className="mr-2"
                            />
                            <span className="text-sm">{option.name}</span>
                          </div>
                          {option.price > 0 && (
                            <span className="text-sm text-green-600">
                              +${option.price.toFixed(2)}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={closeCustomization}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleCustomizationSubmit(selectedProduct, [], 1)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Add to Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 left-4">
        <Card className="bg-black/20 backdrop-blur-sm border-white/20">
          <CardContent className="p-3">
            <div className="text-xs text-white space-y-1">
              <div><kbd className="bg-white/20 px-1 rounded">Ctrl+F</kbd> Search customer</div>
              <div><kbd className="bg-white/20 px-1 rounded">Ctrl+N</kbd> Submit order</div>
              <div><kbd className="bg-white/20 px-1 rounded">Ctrl+H</kbd> Hold/Resume call</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 