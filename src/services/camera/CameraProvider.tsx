"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { CameraService, type CameraConfig } from "./CameraService"

interface CameraContextType {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  service: CameraService
  hasPermission: boolean
  requestPermission: () => Promise<boolean>
  startCamera: (config?: CameraConfig) => Promise<void>
  stopCamera: () => void
  isCameraActive: boolean
}

const CameraContext = createContext<CameraContextType | undefined>(undefined)

interface CameraProviderProps {
  children: ReactNode
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [service] = useState(() => new CameraService())

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await service.requestCameraPermission()
      setHasPermission(granted)
      return granted
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request camera permission")
      return false
    }
  }

  const startCamera = async (config?: CameraConfig) => {
    setIsLoading(true)
    setError(null)

    try {
      await service.startCamera(config)
      setIsCameraActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start camera")
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    service.stopCamera()
    setIsCameraActive(false)
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        await service.initialize()
        const permission = await service.checkCameraPermission()
        setHasPermission(permission)
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize camera")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      service.dispose()
    }
  }, [service])

  const value: CameraContextType = {
    isInitialized,
    isLoading,
    error,
    service,
    hasPermission,
    requestPermission,
    startCamera,
    stopCamera,
    isCameraActive,
  }

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
}

export const useCamera = (): CameraContextType => {
  const context = useContext(CameraContext)
  if (!context) {
    throw new Error("useCamera must be used within a CameraProvider")
  }
  return context
}
