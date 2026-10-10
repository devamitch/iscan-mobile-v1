"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { SocketService } from "./SocketService"
import { useAuthStore } from "@/store/slices/authSlice"

interface SocketContextType {
  isConnected: boolean
  reconnectAttempts: number
  queuedMessages: number
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  reconnectAttempts: 0,
  queuedMessages: 0,
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  const [socketStatus, setSocketStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0,
    queuedMessages: 0,
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      SocketService.connect()
    } else {
      SocketService.disconnect()
    }

    const updateStatus = () => {
      setSocketStatus(SocketService.getConnectionStatus())
    }

    SocketService.on("onConnect", updateStatus)
    SocketService.on("onDisconnect", updateStatus)

    const interval = setInterval(updateStatus, 1000)

    return () => {
      clearInterval(interval)
      SocketService.off("onConnect")
      SocketService.off("onDisconnect")
    }
  }, [isAuthenticated, user])

  return <SocketContext.Provider value={socketStatus}>{children}</SocketContext.Provider>
}
