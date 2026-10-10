"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { AIService } from "./AIService"

interface AIContextType {
  isAvailable: boolean
  availableModels: string[]
  isLoading: boolean
}

const AIContext = createContext<AIContextType>({
  isAvailable: false,
  availableModels: [],
  isLoading: true,
})

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error("useAI must be used within an AIProvider")
  }
  return context
}

interface AIProviderProps {
  children: React.ReactNode
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAI = async () => {
      try {
        setIsLoading(true)
        setIsAvailable(AIService.isAvailable())
        setAvailableModels(AIService.getAvailableModels())
      } catch (error) {
        console.error("Failed to initialize AI service:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAI()
  }, [])

  return <AIContext.Provider value={{ isAvailable, availableModels, isLoading }}>{children}</AIContext.Provider>
}
