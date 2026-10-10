"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { ComputerVisionService } from "./ComputerVisionService"

interface ComputerVisionContextType {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  service: ComputerVisionService
  processImage: (imageUri: string) => Promise<any>
  processVideo: (videoUri: string) => Promise<any>
}

const ComputerVisionContext = createContext<ComputerVisionContextType | undefined>(undefined)

interface ComputerVisionProviderProps {
  children: ReactNode
}

export const ComputerVisionProvider: React.FC<ComputerVisionProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [service] = useState(() => new ComputerVisionService())

  const processImage = async (imageUri: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await service.processImage(imageUri)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const processVideo = async (videoUri: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await service.processVideo(videoUri)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process video")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        await service.initialize()
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize Computer Vision")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      service.dispose()
    }
  }, [service])

  const value: ComputerVisionContextType = {
    isInitialized,
    isLoading,
    error,
    service,
    processImage,
    processVideo,
  }

  return <ComputerVisionContext.Provider value={value}>{children}</ComputerVisionContext.Provider>
}

export const useComputerVision = (): ComputerVisionContextType => {
  const context = useContext(ComputerVisionContext)
  if (!context) {
    throw new Error("useComputerVision must be used within a ComputerVisionProvider")
  }
  return context
}
