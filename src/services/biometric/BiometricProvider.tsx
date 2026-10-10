"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { BiometricService, type BiometricType } from "./BiometricService"

interface BiometricContextType {
  isAvailable: boolean
  supportedTypes: BiometricType[]
  isLoading: boolean
  error: string | null
  service: BiometricService
  authenticate: (reason?: string) => Promise<boolean>
  checkAvailability: () => Promise<void>
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined)

interface BiometricProviderProps {
  children: ReactNode
}

export const BiometricProvider: React.FC<BiometricProviderProps> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [supportedTypes, setSupportedTypes] = useState<BiometricType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [service] = useState(() => new BiometricService())

  const checkAvailability = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const available = await service.isBiometricAvailable()
      const types = await service.getSupportedBiometricTypes()

      setIsAvailable(available)
      setSupportedTypes(types)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check biometric availability")
      setIsAvailable(false)
      setSupportedTypes([])
    } finally {
      setIsLoading(false)
    }
  }

  const authenticate = async (reason?: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await service.authenticate(reason)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAvailability()
  }, [])

  const value: BiometricContextType = {
    isAvailable,
    supportedTypes,
    isLoading,
    error,
    service,
    authenticate,
    checkAvailability,
  }

  return <BiometricContext.Provider value={value}>{children}</BiometricContext.Provider>
}

export const useBiometric = (): BiometricContextType => {
  const context = useContext(BiometricContext)
  if (!context) {
    throw new Error("useBiometric must be used within a BiometricProvider")
  }
  return context
}
