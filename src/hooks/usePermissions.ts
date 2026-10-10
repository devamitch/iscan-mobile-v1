"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { check, request, PERMISSIONS, RESULTS, type Permission } from "react-native-permissions"
import { Platform, Alert, Linking } from "react-native"

export type PermissionStatus = "granted" | "denied" | "blocked" | "unavailable" | "limited"

export interface PermissionState {
  camera: PermissionStatus
  microphone: PermissionStatus
  location: PermissionStatus
  notifications: PermissionStatus
  photos: PermissionStatus
  contacts: PermissionStatus
}

interface PermissionsContextType {
  permissions: PermissionState
  requestPermission: (permission: keyof PermissionState) => Promise<PermissionStatus>
  requestMultiplePermissions: (permissions: (keyof PermissionState)[]) => Promise<PermissionState>
  openSettings: () => void
  isLoading: boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

const getPermissionForPlatform = (permission: keyof PermissionState): Permission => {
  const permissionMap = {
    camera: Platform.OS === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
    microphone: Platform.OS === "ios" ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO,
    location: Platform.OS === "ios" ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    notifications: Platform.OS === "ios" ? PERMISSIONS.IOS.NOTIFICATIONS : PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    photos: Platform.OS === "ios" ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    contacts: Platform.OS === "ios" ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS,
  }

  return permissionMap[permission]
}

const mapPermissionResult = (result: string): PermissionStatus => {
  switch (result) {
    case RESULTS.GRANTED:
      return "granted"
    case RESULTS.DENIED:
      return "denied"
    case RESULTS.BLOCKED:
      return "blocked"
    case RESULTS.UNAVAILABLE:
      return "unavailable"
    case RESULTS.LIMITED:
      return "limited"
    default:
      return "denied"
  }
}

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: "denied",
    microphone: "denied",
    location: "denied",
    notifications: "denied",
    photos: "denied",
    contacts: "denied",
  })
  const [isLoading, setIsLoading] = useState(true)

  const checkAllPermissions = async () => {
    setIsLoading(true)

    try {
      const permissionKeys = Object.keys(permissions) as (keyof PermissionState)[]
      const results = await Promise.all(
        permissionKeys.map(async (key) => {
          const permission = getPermissionForPlatform(key)
          const result = await check(permission)
          return { key, status: mapPermissionResult(result) }
        }),
      )

      const newPermissions = results.reduce((acc, { key, status }) => {
        acc[key] = status
        return acc
      }, {} as PermissionState)

      setPermissions(newPermissions)
    } catch (error) {
      console.error("Error checking permissions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const requestPermission = async (permission: keyof PermissionState): Promise<PermissionStatus> => {
    try {
      const platformPermission = getPermissionForPlatform(permission)
      const result = await request(platformPermission)
      const status = mapPermissionResult(result)

      setPermissions((prev) => ({
        ...prev,
        [permission]: status,
      }))

      if (status === "blocked") {
        Alert.alert(
          "Permission Required",
          `${permission} permission is required for this feature. Please enable it in Settings.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: openSettings },
          ],
        )
      }

      return status
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error)
      return "denied"
    }
  }

  const requestMultiplePermissions = async (permissionList: (keyof PermissionState)[]): Promise<PermissionState> => {
    const results = await Promise.all(
      permissionList.map(async (permission) => {
        const status = await requestPermission(permission)
        return { permission, status }
      }),
    )

    const newPermissions = results.reduce(
      (acc, { permission, status }) => {
        acc[permission] = status
        return acc
      },
      { ...permissions },
    )

    setPermissions(newPermissions)
    return newPermissions
  }

  const openSettings = () => {
    Linking.openSettings()
  }

  useEffect(() => {
    checkAllPermissions()
  }, [])

  const value: PermissionsContextType = {
    permissions,
    requestPermission,
    requestMultiplePermissions,
    openSettings,
    isLoading,
  }

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider")
  }
  return context
}

// Individual permission hooks for convenience
export const useCameraPermission = () => {
  const { permissions, requestPermission } = usePermissions()
  return {
    status: permissions.camera,
    request: () => requestPermission("camera"),
    granted: permissions.camera === "granted",
  }
}

export const useMicrophonePermission = () => {
  const { permissions, requestPermission } = usePermissions()
  return {
    status: permissions.microphone,
    request: () => requestPermission("microphone"),
    granted: permissions.microphone === "granted",
  }
}

export const useLocationPermission = () => {
  const { permissions, requestPermission } = usePermissions()
  return {
    status: permissions.location,
    request: () => requestPermission("location"),
    granted: permissions.location === "granted",
  }
}
