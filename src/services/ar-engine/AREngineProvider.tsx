"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { AREngineService } from "./AREngineService"

interface AREngineContextType {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  service: AREngineService
  startARSession: () => Promise<void>
  stopARSession: () => void
  isARSessionActive: boolean
}

const AREngineContext = createContext<AREngineContextType | undefined>(undefined)

interface AREngineProviderProps {
  children: ReactNode
}

export const AREngineProvider: React.FC<AREngineProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isARSessionActive, setIsARSessionActive] = useState(false)
  const [service] = useState(() => new AREngineService())

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        await service.initialize()
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize AR Engine")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      service.dispose()
    }
  }, [service])

  const startARSession = async () => {
    try {
      await service.startSession()
      setIsARSessionActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start AR session")
    }
  }

  const stopARSession = () => {
    service.stopSession()
    setIsARSessionActive(false)
  }

  const value: AREngineContextType = {
    isInitialized,
    isLoading,
    error,
    service,
    startARSession,
    stopARSession,
    isARSessionActive,
  }

  return <AREngineContext.Provider value={value}>{children}</AREngineContext.Provider>
}

export const useAREngine = (): AREngineContextType => {
  const context = useContext(AREngineContext)
  if (!context) {
    throw new Error("useAREngine must be used within an AREngineProvider")
  }
  return context
}
