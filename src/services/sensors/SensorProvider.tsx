"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { SensorService, type SensorData } from "./SensorService"

interface SensorContextType {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  service: SensorService
  sensorData: SensorData
  startSensors: () => Promise<void>
  stopSensors: () => void
  isSensorsActive: boolean
}

const SensorContext = createContext<SensorContextType | undefined>(undefined)

interface SensorProviderProps {
  children: ReactNode
}

export const SensorProvider: React.FC<SensorProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSensorsActive, setIsSensorsActive] = useState(false)
  const [sensorData, setSensorData] = useState<SensorData>({
    accelerometer: { x: 0, y: 0, z: 0, timestamp: 0 },
    gyroscope: { x: 0, y: 0, z: 0, timestamp: 0 },
    magnetometer: { x: 0, y: 0, z: 0, timestamp: 0 },
    orientation: { pitch: 0, roll: 0, yaw: 0, timestamp: 0 },
    proximity: { distance: 0, timestamp: 0 },
    lightSensor: { illuminance: 0, timestamp: 0 },
  })
  const [service] = useState(() => new SensorService())

  const startSensors = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await service.startSensors()
      setIsSensorsActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sensors")
    } finally {
      setIsLoading(false)
    }
  }

  const stopSensors = () => {
    service.stopSensors()
    setIsSensorsActive(false)
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        await service.initialize()
        setIsInitialized(true)

        // Subscribe to sensor data updates
        const unsubscribe = service.onSensorData((data) => {
          setSensorData(data)
        })

        return unsubscribe
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize sensors")
      } finally {
        setIsLoading(false)
      }
    }

    const cleanup = initialize()

    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.())
      service.dispose()
    }
  }, [service])

  const value: SensorContextType = {
    isInitialized,
    isLoading,
    error,
    service,
    sensorData,
    startSensors,
    stopSensors,
    isSensorsActive,
  }

  return <SensorContext.Provider value={value}>{children}</SensorContext.Provider>
}

export const useSensor = (): SensorContextType => {
  const context = useContext(SensorContext)
  if (!context) {
    throw new Error("useSensor must be used within a SensorProvider")
  }
  return context
}
