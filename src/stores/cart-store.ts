import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  description: string
  basePrice: number
  quantity: number
  size?: {
    id: string
    name: string
    price: number
  }
  toppings: Array<{
    id: string
    name: string
    price: number
  }>
  specialInstructions?: string
  image?: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  
  // Computed values
  getItemCount: () => number
  getSubtotal: () => number
  getDeliveryFee: () => number
  getTax: () => number
  getTotal: () => number
  getItemPrice: (item: CartItem) => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const items = get().items
        const existingItemIndex = items.findIndex(
          (item) =>
            item.productId === newItem.productId &&
            item.size?.id === newItem.size?.id &&
            JSON.stringify(item.toppings.sort()) === JSON.stringify(newItem.toppings.sort()) &&
            item.specialInstructions === newItem.specialInstructions
        )

        if (existingItemIndex > -1) {
          // Update existing item quantity
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += newItem.quantity
          set({ items: updatedItems })
        } else {
          // Add new item
          const itemId = `${newItem.productId}-${Date.now()}-${Math.random()}`
          set({
            items: [...items, { ...newItem, id: itemId }],
          })
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          return total + get().getItemPrice(item) * item.quantity
        }, 0)
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal()
        // Free delivery over €25
        return subtotal >= 25 ? 0 : 3
      },

      getTax: () => {
        const subtotal = get().getSubtotal()
        // 20% tax rate
        return subtotal * 0.2
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const deliveryFee = get().getDeliveryFee()
        const tax = get().getTax()
        return subtotal + deliveryFee + tax
      },

      getItemPrice: (item) => {
        let price = item.basePrice
        if (item.size) {
          price += item.size.price
        }
        price += item.toppings.reduce((sum, topping) => sum + topping.price, 0)
        return price
      },
    }),
    {
      name: 'spago-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
) 
