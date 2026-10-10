"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import NetInfo from "@react-native-community/netinfo"
import { AppState, type AppStateStatus } from "react-native"

import { useAuthStore } from "@/store/slices/authSlice"
import { API_CONFIG } from "@/config/constants"

export interface SocketMessage {
  id: string
  type: string
  data: any
  timestamp: number
  userId?: string
}

export interface UseSocketOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, reconnectAttempts = 5, reconnectDelay = 1000 } = options

  const { user, isAuthenticated } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageQueue, setMessageQueue] = useState<SocketMessage[]>([])
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!isAuthenticated || !user || socketRef.current?.connected) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      socketRef.current = io(API_CONFIG.SOCKET_URL, {
        auth: {
          userId: user.id,
          token: user.id, // In a real app, use a proper JWT token
        },
        transports: ["websocket"],
        timeout: 10000,
        reconnection: false, // We'll handle reconnection manually
      })

      const socket = socketRef.current

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0

        // Send queued messages
        messageQueue.forEach((message) => {
          socket.emit("message", message)
        })
        setMessageQueue([])
      })

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason)
        setIsConnected(false)
        setIsConnecting(false)

        // Auto-reconnect if not manually disconnected
        if (reason !== "io client disconnect") {
          scheduleReconnect()
        }
      })

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        setIsConnecting(false)
        setError(error.message)
        scheduleReconnect()
      })

      socket.on("error", (error) => {
        console.error("Socket error:", error)
        setError(error.message || "Socket error occurred")
      })
    } catch (error) {
      console.error("Socket initialization error:", error)
      setIsConnecting(false)
      setError(error.message || "Failed to initialize socket")
    }
  }, [isAuthenticated, user, messageQueue])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setError(null)
    reconnectAttemptsRef.current = 0
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      setError("Max reconnection attempts reached")
      return
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1

    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`)

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isAuthenticated && user) {
        connect()
      }
    }, delay)
  }, [reconnectAttempts, reconnectDelay, connect, isAuthenticated, user])

  const emit = useCallback(
    (event: string, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data)
      } else {
        // Queue message for when connection is restored
        const message: SocketMessage = {
          id: Date.now().toString(),
          type: event,
          data,
          timestamp: Date.now(),
          userId: user?.id,
        }
        setMessageQueue((prev) => [...prev, message])
      }
    },
    [user?.id],
  )

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback)
      } else {
        socketRef.current.off(event)
      }
    }
  }, [])

  // Handle network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !isConnected && isAuthenticated && user) {
        connect()
      } else if (!state.isConnected && isConnected) {
        setError("Network connection lost")
      }
    })

    return unsubscribe
  }, [connect, isConnected, isAuthenticated, user])

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && !isConnected && isAuthenticated && user) {
        connect()
      } else if (nextAppState === "background" && isConnected) {
        // Keep connection alive in background for real-time features
        // In a production app, you might want to disconnect to save battery
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => subscription?.remove()
  }, [connect, isConnected, isAuthenticated, user])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isAuthenticated && user && !socketRef.current) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, isAuthenticated, user, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    messageQueue: messageQueue.length,
    connect,
    disconnect,
    emit,
    on,
    off,
  }
}
