"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { NotificationService, type NotificationConfig } from "./NotificationService"

interface NotificationContextType {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  service: NotificationService
  hasPermission: boolean
  requestPermission: () => Promise<boolean>
  showNotification: (config: NotificationConfig) => Promise<void>
  scheduleNotification: (config: NotificationConfig, date: Date) => Promise<string>
  cancelNotification: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [service] = useState(() => new NotificationService())

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await service.requestPermission()
      setHasPermission(granted)
      return granted
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request notification permission")
      return false
    }
  }

  const showNotification = async (config: NotificationConfig) => {
    try {
      await service.showNotification(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show notification")
      throw err
    }
  }

  const scheduleNotification = async (config: NotificationConfig, date: Date): Promise<string> => {
    try {
      return await service.scheduleNotification(config, date)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule notification")
      throw err
    }
  }

  const cancelNotification = async (id: string) => {
    try {
      await service.cancelNotification(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel notification")
      throw err
    }
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        await service.initialize()
        const permission = await service.checkPermission()
        setHasPermission(permission)
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize notifications")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      service.dispose()
    }
  }, [service])

  const value: NotificationContextType = {
    isInitialized,
    isLoading,
    error,
    service,
    hasPermission,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}
