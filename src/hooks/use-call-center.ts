import { useState, useEffect, useCallback } from 'react';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addresses: Address[];
  orderHistory: OrderHistory[];
  preferences: CustomerPreferences;
  loyaltyPoints?: number;
  lastOrderDate?: Date;
}

export interface Address {
  id: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  street: string;
  city: string;
  postalCode: string;
  instructions?: string;
  isDefault: boolean;
}

export interface OrderHistory {
  id: string;
  date: Date;
  total: number;
  items: OrderItem[];
  status: string;
}

export interface CustomerPreferences {
  favoriteItems: string[];
  allergies: string[];
  specialInstructions?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE';
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  customizations: Customization[];
  notes?: string;
}

export interface Customization {
  id: string;
  name: string;
  price: number;
  type: 'SIZE' | 'TOPPING' | 'OPTION';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  customizations: CustomizationOption[];
  isActive: boolean;
  prepTime: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'SIZE' | 'TOPPING' | 'OPTION';
  options: CustomizationChoice[];
  required: boolean;
  maxSelections?: number;
}

export interface CustomizationChoice {
  id: string;
  name: string;
  price: number;
}

export interface CallCenterState {
  // Customer Management
  currentCustomer: Customer | null;
  searchQuery: string;
  searchResults: Customer[];
  isSearching: boolean;

  // Order Management
  currentOrder: OrderItem[];
  selectedAddress: Address | null;
  orderNotes: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;

  // Call Management
  callStartTime: Date | null;
  callDuration: number;
  operatorId: string;
  isOnCall: boolean;
  callStatus: 'IDLE' | 'INCOMING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

  // UI State
  selectedProduct: Product | null;
  showCustomizationModal: boolean;
  showCustomerHistory: boolean;
  isProcessingOrder: boolean;

  // Products
  products: Product[];
  categories: string[];
  quickAccessItems: Product[];
}

export const useCallCenter = () => {
  const [state, setState] = useState<CallCenterState>({
    // Customer Management
    currentCustomer: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false,

    // Order Management
    currentOrder: [],
    selectedAddress: null,
    orderNotes: '',
    subtotal: 0,
    tax: 0,
    deliveryFee: 3.99,
    total: 0,

    // Call Management
    callStartTime: null,
    callDuration: 0,
    operatorId: 'OPR001',
    isOnCall: false,
    callStatus: 'IDLE',

    // UI State
    selectedProduct: null,
    showCustomizationModal: false,
    showCustomerHistory: false,
    isProcessingOrder: false,

    // Products
    products: [],
    categories: [],
    quickAccessItems: [],
  });

  // Initialize mock data
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Margherita Pizza',
        price: 15.99,
        category: 'Pizza',
        description: 'Fresh tomato sauce, mozzarella, basil',
        customizations: [
          {
            id: 'size',
            name: 'Size',
            type: 'SIZE',
            required: true,
            options: [
              { id: 'small', name: 'Small (10")', price: 0 },
              { id: 'medium', name: 'Medium (12")', price: 3 },
              { id: 'large', name: 'Large (14")', price: 6 },
            ],
          },
          {
            id: 'toppings',
            name: 'Extra Toppings',
            type: 'TOPPING',
            required: false,
            maxSelections: 5,
            options: [
              { id: 'pepperoni', name: 'Pepperoni', price: 2.50 },
              { id: 'mushrooms', name: 'Mushrooms', price: 1.50 },
              { id: 'olives', name: 'Olives', price: 1.50 },
              { id: 'peppers', name: 'Bell Peppers', price: 1.50 },
            ],
          },
        ],
        isActive: true,
        prepTime: 15,
      },
      {
        id: '2',
        name: 'Pepperoni Pizza',
        price: 18.99,
        category: 'Pizza',
        description: 'Pepperoni, mozzarella, tomato sauce',
        customizations: [
          {
            id: 'size',
            name: 'Size',
            type: 'SIZE',
            required: true,
            options: [
              { id: 'small', name: 'Small (10")', price: 0 },
              { id: 'medium', name: 'Medium (12")', price: 3 },
              { id: 'large', name: 'Large (14")', price: 6 },
            ],
          },
        ],
        isActive: true,
        prepTime: 15,
      },
      {
        id: '3',
        name: 'Caesar Salad',
        price: 12.99,
        category: 'Salads',
        description: 'Romaine lettuce, parmesan, croutons, caesar dressing',
        customizations: [
          {
            id: 'protein',
            name: 'Add Protein',
            type: 'OPTION',
            required: false,
            options: [
              { id: 'chicken', name: 'Grilled Chicken', price: 4.99 },
              { id: 'shrimp', name: 'Grilled Shrimp', price: 6.99 },
            ],
          },
        ],
        isActive: true,
        prepTime: 8,
      },
      {
        id: '4',
        name: 'Garlic Bread',
        price: 6.99,
        category: 'Sides',
        description: 'Fresh baked bread with garlic butter',
        customizations: [],
        isActive: true,
        prepTime: 5,
      },
      {
        id: '5',
        name: 'Coca Cola',
        price: 2.99,
        category: 'Beverages',
        description: '500ml bottle',
        customizations: [],
        isActive: true,
        prepTime: 1,
      },
    ];

    setState(prev => ({
      ...prev,
      products: mockProducts,
      categories: ['Pizza', 'Salads', 'Sides', 'Beverages'],
      quickAccessItems: mockProducts.slice(0, 3),
    }));
  }, []);

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isOnCall && state.callStartTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - state.callStartTime!.getTime()) / 1000);
        setState(prev => ({ ...prev, callDuration: duration }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isOnCall, state.callStartTime]);

  // Calculate totals
  useEffect(() => {
    const subtotal = state.currentOrder.reduce((sum, item) => {
      const itemTotal = (item.price + item.customizations.reduce((custSum, cust) => custSum + cust.price, 0)) * item.quantity;
      return sum + itemTotal;
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax + state.deliveryFee;

    setState(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
    }));
  }, [state.currentOrder, state.deliveryFee]);

  // Customer search
  const searchCustomers = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, isSearching: true, searchQuery: query }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'John Smith',
        phone: '+1 555-0123',
        email: 'john.smith@email.com',
        addresses: [
          {
            id: '1',
            type: 'HOME',
            street: '123 Main St',
            city: 'New York',
            postalCode: '10001',
            instructions: 'Ring doorbell twice',
            isDefault: true,
          },
        ],
        orderHistory: [
          {
            id: '1',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            total: 32.99,
            items: [],
            status: 'DELIVERED',
          },
        ],
        preferences: {
          favoriteItems: ['1', '2'],
          allergies: [],
          paymentMethod: 'CARD',
        },
        loyaltyPoints: 150,
        lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        phone: '+1 555-0124',
        email: 'sarah.j@email.com',
        addresses: [
          {
            id: '2',
            type: 'HOME',
            street: '456 Oak Ave',
            city: 'New York',
            postalCode: '10002',
            isDefault: true,
          },
        ],
        orderHistory: [],
        preferences: {
          favoriteItems: [],
          allergies: ['gluten'],
        },
      },
    ];

    const results = mockCustomers.filter(customer =>
      customer.phone.includes(query) ||
      customer.name.toLowerCase().includes(query.toLowerCase())
    );

    setState(prev => ({
      ...prev,
      isSearching: false,
      searchResults: results,
    }));
  }, []);

  const selectCustomer = useCallback((customer: Customer) => {
    setState(prev => ({
      ...prev,
      currentCustomer: customer,
      selectedAddress: customer.addresses.find(addr => addr.isDefault) || customer.addresses[0] || null,
      searchResults: [],
      searchQuery: '',
    }));
  }, []);

  const startCall = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnCall: true,
      callStartTime: new Date(),
      callStatus: 'ACTIVE',
      callDuration: 0,
    }));
  }, []);

  const endCall = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnCall: false,
      callStartTime: null,
      callStatus: 'COMPLETED',
      callDuration: 0,
    }));
  }, []);

  const holdCall = useCallback(() => {
    setState(prev => ({
      ...prev,
      callStatus: prev.callStatus === 'ON_HOLD' ? 'ACTIVE' : 'ON_HOLD',
    }));
  }, []);

  const addToOrder = useCallback((product: Product, customizations: Customization[] = [], quantity: number = 1) => {
    const orderItem: OrderItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      customizations,
    };

    setState(prev => ({
      ...prev,
      currentOrder: [...prev.currentOrder, orderItem],
    }));
  }, []);

  const removeFromOrder = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      currentOrder: prev.currentOrder.filter(item => item.id !== itemId),
    }));
  }, []);

  const updateOrderItem = useCallback((itemId: string, updates: Partial<OrderItem>) => {
    setState(prev => ({
      ...prev,
      currentOrder: prev.currentOrder.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const clearOrder = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentOrder: [],
    }));
  }, []);

  const submitOrder = useCallback(async () => {
    if (!state.currentCustomer || !state.selectedAddress || state.currentOrder.length === 0) {
      throw new Error('Missing required order information');
    }

    setState(prev => ({ ...prev, isProcessingOrder: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Order submitted successfully
      setState(prev => ({
        ...prev,
        isProcessingOrder: false,
        currentOrder: [],
        orderNotes: '',
      }));

      return {
        id: `ORD-${Date.now()}`,
        customer: state.currentCustomer,
        items: state.currentOrder,
        total: state.total,
        status: 'CONFIRMED',
      };
    } catch (error) {
      setState(prev => ({ ...prev, isProcessingOrder: false }));
      throw error;
    }
  }, [state.currentCustomer, state.selectedAddress, state.currentOrder, state.total]);

  const openCustomization = useCallback((product: Product) => {
    setState(prev => ({
      ...prev,
      selectedProduct: product,
      showCustomizationModal: true,
    }));
  }, []);

  const closeCustomization = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedProduct: null,
      showCustomizationModal: false,
    }));
  }, []);

  const toggleCustomerHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCustomerHistory: !prev.showCustomerHistory,
    }));
  }, []);

  const setOrderNotes = useCallback((notes: string) => {
    setState(prev => ({ ...prev, orderNotes: notes }));
  }, []);

  const setSelectedAddress = useCallback((address: Address) => {
    setState(prev => ({ ...prev, selectedAddress: address }));
  }, []);

  return {
    // State
    ...state,

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
  };
}; 