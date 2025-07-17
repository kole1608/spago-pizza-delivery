import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Modals
  isAuthModalOpen: boolean
  isProfileModalOpen: boolean
  isAddressModalOpen: boolean
  
  // Loading states
  isLoading: boolean
  loadingMessage?: string
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    timestamp: number
  }>
  
  // User preferences
  preferences: {
    defaultDeliveryAddress?: string
    savePaymentInfo: boolean
    emailNotifications: boolean
    smsNotifications: boolean
    orderReminders: boolean
  }
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Modal actions
  openAuthModal: () => void
  closeAuthModal: () => void
  openProfileModal: () => void
  closeProfileModal: () => void
  openAddressModal: () => void
  closeAddressModal: () => void
  
  // Loading actions
  setLoading: (loading: boolean, message?: string) => void
  
  // Notification actions
  addNotification: (notification: Omit<UIStore['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Preference actions
  updatePreferences: (preferences: Partial<UIStore['preferences']>) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      
      isAuthModalOpen: false,
      isProfileModalOpen: false,
      isAddressModalOpen: false,
      
      isLoading: false,
      loadingMessage: undefined,
      
      notifications: [],
      
      preferences: {
        savePaymentInfo: false,
        emailNotifications: true,
        smsNotifications: true,
        orderReminders: true,
      },
      
      setTheme: (theme) => {
        set({ theme })
      },
      
      openAuthModal: () => {
        set({ isAuthModalOpen: true })
      },
      
      closeAuthModal: () => {
        set({ isAuthModalOpen: false })
      },
      
      openProfileModal: () => {
        set({ isProfileModalOpen: true })
      },
      
      closeProfileModal: () => {
        set({ isProfileModalOpen: false })
      },
      
      openAddressModal: () => {
        set({ isAddressModalOpen: true })
      },
      
      closeAddressModal: () => {
        set({ isAddressModalOpen: false })
      },
      
      setLoading: (isLoading, loadingMessage) => {
        set({ isLoading, loadingMessage })
      },
      
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random()}`
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now(),
        }
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 5) // Keep only 5 most recent
        }))
        
        // Auto-remove after 5 seconds for success/info notifications
        if (notification.type === 'success' || notification.type === 'info') {
          setTimeout(() => {
            get().removeNotification(id)
          }, 5000)
        }
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }))
      },
      
      clearNotifications: () => {
        set({ notifications: [] })
      },
      
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        }))
      },
    }),
    {
      name: 'spago-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        preferences: state.preferences,
      }),
    }
  )
) 
