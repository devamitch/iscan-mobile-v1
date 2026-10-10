"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { mediaPipeService, type MediaPipeConfig } from "./MediaPipeService"

interface MediaPipeContextType {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  initialize: (config: MediaPipeConfig) => Promise<void>
  service: typeof mediaPipeService
}

const MediaPipeContext = createContext<MediaPipeContextType | undefined>(undefined)

interface MediaPipeProviderProps {
  children: ReactNode
  config?: MediaPipeConfig
}

const defaultConfig: MediaPipeConfig = {
  enableFaceDetection: true,
  enableFaceMesh: true,
  enableHandTracking: true,
  enablePoseEstimation: true,
  enableHolistic: false,
  enableSelfieSegmentation: true,
  enableObjectDetection: true,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
}

export const MediaPipeProvider: React.FC<MediaPipeProviderProps> = ({ children, config = defaultConfig }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialize = async (customConfig?: MediaPipeConfig) => {
    setIsLoading(true)
    setError(null)

    try {
      await mediaPipeService.initialize(customConfig || config)
      setIsInitialized(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize MediaPipe")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initialize()

    return () => {
      mediaPipeService.dispose()
    }
  }, [])

  const value: MediaPipeContextType = {
    isInitialized,
    isLoading,
    error,
    initialize,
    service: mediaPipeService,
  }

  return <MediaPipeContext.Provider value={value}>{children}</MediaPipeContext.Provider>
}

export const useMediaPipe = (): MediaPipeContextType => {
  const context = useContext(MediaPipeContext)
  if (!context) {
    throw new Error("useMediaPipe must be used within a MediaPipeProvider")
  }
  return context
}
