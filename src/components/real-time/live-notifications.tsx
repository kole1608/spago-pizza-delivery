'use client'

import { useEffect, useState } from 'react'
import { X, Bell, CheckCircle, AlertTriangle, Info, Truck, ChefHat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWebSocketStore } from '@/stores/websocket-store'

interface NotificationProps {
  id: string
  type: 'order_confirmed' | 'order_preparing' | 'order_ready' | 'driver_assigned' | 'order_delivered' | 'inventory_alert'
  title: string
  message: string
  timestamp: Date
  orderId?: string
  data?: any
  onDismiss: () => void
  onClick?: () => void
}

interface LiveNotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxNotifications?: number
  autoHideDuration?: number
  className?: string
}

const NotificationIcon = ({ type }: { type: NotificationProps['type'] }) => {
  switch (type) {
    case 'order_confirmed':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'order_preparing':
      return <ChefHat className="h-5 w-5 text-orange-600" />
    case 'order_ready':
      return <Bell className="h-5 w-5 text-blue-600" />
    case 'driver_assigned':
    case 'order_delivered':
      return <Truck className="h-5 w-5 text-green-600" />
    case 'inventory_alert':
      return <AlertTriangle className="h-5 w-5 text-red-600" />
    default:
      return <Info className="h-5 w-5 text-gray-600" />
  }
}

const getNotificationColors = (type: NotificationProps['type']) => {
  switch (type) {
    case 'order_confirmed':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'order_preparing':
      return 'border-orange-200 bg-orange-50 text-orange-900'
    case 'order_ready':
      return 'border-blue-200 bg-blue-50 text-blue-900'
    case 'driver_assigned':
    case 'order_delivered':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'inventory_alert':
      return 'border-red-200 bg-red-50 text-red-900'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-900'
  }
}

function NotificationItem({ 
  id,
  type, 
  title, 
  message, 
  timestamp, 
  orderId, 
  onDismiss, 
  onClick 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${getNotificationColors(type)}`}
            onClick={onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <NotificationIcon type={type} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate pr-2">
                      {title}
                    </h4>
                    <div className="flex items-center gap-1">
                      {orderId && (
                        <Badge variant="outline" className="text-xs">
                          #{orderId.slice(-4)}
                        </Badge>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDismiss()
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm opacity-90 mb-2 line-clamp-2">
                    {message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">
                      {formatTime(timestamp)}
                    </span>
                    
                    {onClick && (
                      <span className="text-xs opacity-75 hover:opacity-100">
                        Click to view →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function LiveNotifications({
  position = 'top-right',
  maxNotifications = 5,
  autoHideDuration = 8000,
  className
}: LiveNotificationsProps) {
  const [localNotifications, setLocalNotifications] = useState<Array<NotificationProps & { id: string; timestamp: Date }>>([])
  
  const { 
    notifications, 
    markNotificationRead,
    clearNotifications 
  } = useWebSocketStore()

  // Convert store notifications to local format
  useEffect(() => {
    const newNotifications = notifications.map(notification => ({
      ...notification,
      id: `${notification.orderId}-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      onDismiss: () => markNotificationRead(notification.orderId),
      onClick: notification.orderId ? () => {
        // Navigate to order details
        window.location.href = `/orders/${notification.orderId}`
      } : undefined
    }))

    setLocalNotifications(prev => {
      // Merge new notifications, keeping only the latest ones
      const combined = [...newNotifications, ...prev]
      return combined.slice(0, maxNotifications)
    })
  }, [notifications, maxNotifications, markNotificationRead])

  // Auto-hide notifications
  useEffect(() => {
    if (autoHideDuration > 0) {
      localNotifications.forEach(notification => {
        const timeElapsed = Date.now() - notification.timestamp.getTime()
        const remainingTime = autoHideDuration - timeElapsed
        
        if (remainingTime > 0) {
          setTimeout(() => {
            handleDismiss(notification.id)
          }, remainingTime)
        }
      })
    }
  }, [localNotifications, autoHideDuration])

  const handleDismiss = (notificationId: string) => {
    setLocalNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  const handleClearAll = () => {
    setLocalNotifications([])
    clearNotifications()
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  if (localNotifications.length === 0) {
    return null
  }

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-50 pointer-events-none ${className}`}
      style={{ width: '380px' }}
    >
      <div className="space-y-3 pointer-events-auto">
        {/* Clear All Button */}
        {localNotifications.length > 1 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="bg-white/90 backdrop-blur-sm border-gray-200 text-gray-600 hover:text-gray-800"
            >
              Clear All ({localNotifications.length})
            </Button>
          </div>
        )}
        
        {/* Notifications List */}
        <AnimatePresence mode="popLayout">
          {localNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              {...notification}
              onDismiss={() => handleDismiss(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Hook for programmatically showing notifications
export function useNotifications() {
  const { addNotification } = useWebSocketStore()

  const showNotification = (notification: Omit<NotificationProps, 'id' | 'timestamp' | 'onDismiss'>) => {
    addNotification({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      orderId: notification.orderId || `notification-${Date.now()}`,
      data: notification.data
    })
  }

  const showSuccess = (title: string, message: string, orderId?: string) => {
    showNotification({
      type: 'order_confirmed',
      title,
      message,
      orderId
    })
  }

  const showWarning = (title: string, message: string, orderId?: string) => {
    showNotification({
      type: 'inventory_alert',
      title,
      message,
      orderId
    })
  }

  const showInfo = (title: string, message: string, orderId?: string) => {
    showNotification({
      type: 'order_ready',
      title,
      message,
      orderId
    })
  }

  return {
    showNotification,
    showSuccess,
    showWarning,
    showInfo
  }
} 