import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  sendMessage: (data: any) => void
  connect: () => void
  disconnect: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options

  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (socket?.connected) return

    setIsConnecting(true)
    setError(null)

    try {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SITE_URL || ''
        : 'http://localhost:3000'

      const newSocket = io(socketUrl, {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false,
        reconnection: false, // We'll handle reconnection manually
      })

      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected')
        setSocket(newSocket)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      })

      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason)
        setIsConnected(false)
        onDisconnect?.()

        // Auto-reconnect if not manually disconnected
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
            connect()
          }, reconnectDelay * reconnectAttemptsRef.current)
        }
      })

      newSocket.on('connect_error', (err) => {
        console.error('🔥 WebSocket connection error:', err)
        setIsConnecting(false)
        setError(err.message)
        onError?.(err)

        // Retry connection
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay * reconnectAttemptsRef.current)
        }
      })

      newSocket.on('message', (data) => {
        onMessage?.(data)
      })

      // Generic event listener for any server events
      newSocket.onAny((eventName, ...args) => {
        if (eventName !== 'connect' && eventName !== 'disconnect') {
          onMessage?.({ type: eventName, data: args[0] })
        }
      })

    } catch (err) {
      setIsConnecting(false)
      setError(err instanceof Error ? err.message : 'Connection failed')
      onError?.(err instanceof Error ? err : new Error('Connection failed'))
    }
  }, [onMessage, onConnect, onDisconnect, onError, reconnectAttempts, reconnectDelay])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [socket])

  const sendMessage = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.emit('message', data)
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }, [socket, isConnected])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    connect,
    disconnect
  }
}