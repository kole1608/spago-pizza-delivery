'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Clock, 
  Star, 
  Plus,
  Zap,
  Filter
} from 'lucide-react';
import type { Product } from '@/hooks/use-call-center';

interface MenuGridProps {
  products: Product[];
  categories: string[];
  quickAccessItems: Product[];
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export function MenuGrid({
  products,
  categories,
  quickAccessItems,
  onSelectProduct,
  onQuickAdd,
}: MenuGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.filter(product => product.isActive);
  }, [products, selectedCategory, searchQuery]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pizza': return '🍕';
      case 'salads': return '🥗';
      case 'sides': return '🍞';
      case 'beverages': return '🥤';
      case 'desserts': return '🍰';
      default: return '🍽️';
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      {/* Quick Access Items */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-600" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {quickAccessItems.map((product) => (
              <Button
                key={product.id}
                onClick={() => onQuickAdd(product)}
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:bg-orange-50 hover:border-orange-300"
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatPrice(product.price)} • {product.prepTime}min
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-orange-600" />
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Search and Filter */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Menu Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="text-xs"
                >
                  <span className="mr-1">{getCategoryIcon(category)}</span>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Products Grid */}
            <TabsContent value={selectedCategory} className="mt-4">
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
                    onClick={() => onSelectProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getCategoryIcon(product.category)}</span>
                          <div>
                            <div className="font-medium text-sm text-gray-800">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">
                            {formatPrice(product.price)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {product.prepTime}min
                          </div>
                        </div>
                      </div>

                      {/* Product Description */}
                      {product.description && (
                        <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {product.description}
                        </div>
                      )}

                      {/* Customization Indicator */}
                      {product.customizations.length > 0 && (
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {product.customizations.length} customization{product.customizations.length !== 1 ? 's' : ''}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickAdd(product);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {/* No Customization - Quick Add */}
                      {product.customizations.length === 0 && (
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickAdd(product);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Quick Add
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* No Results */}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No items found</div>
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-blue-600"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      <Card className="bg-blue-50/50 backdrop-blur-sm border-blue-200">
        <CardContent className="p-3">
          <div className="text-xs text-blue-800">
            <div className="font-medium mb-1">💡 Quick Tips:</div>
            <div>• Click items to customize • Use Quick Add for instant ordering</div>
            <div>• Search by name or description • Use tabs to filter by category</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 