'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Phone, 
  MapPin, 
  Clock, 
  Star, 
  User, 
  Plus,
  History,
  Heart
} from 'lucide-react';
import type { Customer, Address } from '@/hooks/use-call-center';

interface CustomerSearchProps {
  searchQuery: string;
  searchResults: Customer[];
  currentCustomer: Customer | null;
  selectedAddress: Address | null;
  isSearching: boolean;
  showCustomerHistory: boolean;
  onSearch: (query: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectAddress: (address: Address) => void;
  onToggleHistory: () => void;
  onCreateNewCustomer: () => void;
}

export function CustomerSearch({
  searchQuery,
  searchResults,
  currentCustomer,
  selectedAddress,
  isSearching,
  showCustomerHistory,
  onSearch,
  onSelectCustomer,
  onSelectAddress,
  onToggleHistory,
  onCreateNewCustomer,
}: CustomerSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.length >= 3) {
        onSearch(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, onSearch]);

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case 'HOME': return 'bg-green-100 text-green-800';
      case 'WORK': return 'bg-blue-100 text-blue-800';
      case 'OTHER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysSinceLastOrder = (date?: Date) => {
    if (!date) return null;
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Search className="w-5 h-5 mr-2 text-blue-600" />
            Customer Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by phone or name..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="pl-10 pr-4"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          <Button
            onClick={onCreateNewCustomer}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Customer
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && !currentCustomer && (
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((customer) => {
              const daysSince = getDaysSinceLastOrder(customer.lastOrderDate);
              return (
                <div
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-800">{customer.name}</div>
                    {customer.loyaltyPoints && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {customer.loyaltyPoints} pts
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Phone className="w-3 h-3 mr-1" />
                    {formatPhoneNumber(customer.phone)}
                  </div>
                  
                  {customer.addresses[0] && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {customer.addresses[0].street}, {customer.addresses[0].city}
                    </div>
                  )}
                  
                  {daysSince !== null && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Last order: {daysSince === 0 ? 'Today' : `${daysSince} days ago`}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Selected Customer */}
      {currentCustomer && (
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg border-l-4 border-l-blue-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Customer Information
              </CardTitle>
              <Button
                onClick={onToggleHistory}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                <History className="w-4 h-4 mr-1" />
                History
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Details */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="font-semibold text-gray-800 mb-1">{currentCustomer.name}</div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Phone className="w-3 h-3 mr-1" />
                  {formatPhoneNumber(currentCustomer.phone)}
                </div>
                {currentCustomer.email && (
                  <div className="text-sm text-gray-600">{currentCustomer.email}</div>
                )}
              </div>

              {/* Loyalty & Stats */}
              <div className="flex items-center space-x-4">
                {currentCustomer.loyaltyPoints && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    {currentCustomer.loyaltyPoints} Points
                  </Badge>
                )}
                <Badge variant="secondary">
                  {currentCustomer.orderHistory.length} Orders
                </Badge>
              </div>

              {/* Preferences */}
              {currentCustomer.preferences.favoriteItems.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    Favorites
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentCustomer.preferences.favoriteItems.length} saved items
                  </div>
                </div>
              )}

              {/* Allergies */}
              {currentCustomer.preferences.allergies.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">⚠️ Allergies</div>
                  <div className="text-xs text-red-600">
                    {currentCustomer.preferences.allergies.join(', ')}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Addresses */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Delivery Addresses</div>
              <div className="space-y-2">
                {currentCustomer.addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => onSelectAddress(address)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddress?.id === address.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={getAddressTypeColor(address.type)} variant="secondary">
                        {address.type}
                      </Badge>
                      {address.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-800 mb-1">
                      {address.street}
                    </div>
                    <div className="text-sm text-gray-600">
                      {address.city}, {address.postalCode}
                    </div>
                    
                    {address.instructions && (
                      <div className="text-xs text-gray-500 mt-1 italic">
                        "{address.instructions}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Customer History */}
            {showCustomerHistory && currentCustomer.orderHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Recent Orders</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {currentCustomer.orderHistory.slice(0, 3).map((order) => (
                      <div key={order.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Order #{order.id}</span>
                          <span className="text-green-600">${order.total.toFixed(2)}</span>
                        </div>
                        <div className="text-gray-600">
                          {order.date.toLocaleDateString()} • {order.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 