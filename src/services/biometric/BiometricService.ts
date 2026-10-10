import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics"
import { Alert, Platform } from "react-native"

export type BiometricType = "TouchID" | "FaceID" | "Biometrics" | "None"

export interface BiometricResult {
  success: boolean
  error?: string
  signature?: string
}

export class BiometricService {
  private rnBiometrics: ReactNativeBiometrics

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    })
  }

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable()
      return available
    } catch (error) {
      console.error("Error checking biometric availability:", error)
      return false
    }
  }

  async getSupportedBiometricTypes(): Promise<BiometricType[]> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable()

      if (!available) {
        return ["None"]
      }

      const types: BiometricType[] = []

      if (biometryType === BiometryTypes.TouchID) {
        types.push("TouchID")
      } else if (biometryType === BiometryTypes.FaceID) {
        types.push("FaceID")
      } else if (biometryType === BiometryTypes.Biometrics) {
        types.push("Biometrics")
      }

      return types.length > 0 ? types : ["None"]
    } catch (error) {
      console.error("Error getting biometric types:", error)
      return ["None"]
    }
  }

  async authenticate(reason?: string): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable()

      if (!available) {
        throw new Error("Biometric authentication not available")
      }

      const promptMessage = reason || "Authenticate to continue"

      const { success, error } = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: "Cancel",
      })

      if (success) {
        return true
      } else {
        throw new Error(error || "Authentication failed")
      }
    } catch (error) {
      console.error("Biometric authentication error:", error)
      throw error
    }
  }

  async createKeys(): Promise<boolean> {
    try {
      const { publicKey } = await this.rnBiometrics.createKeys()
      return !!publicKey
    } catch (error) {
      console.error("Error creating biometric keys:", error)
      return false
    }
  }

  async deleteKeys(): Promise<boolean> {
    try {
      const { keysDeleted } = await this.rnBiometrics.deleteKeys()
      return keysDeleted
    } catch (error) {
      console.error("Error deleting biometric keys:", error)
      return false
    }
  }

  async createSignature(payload: string): Promise<string | null> {
    try {
      const { success, signature, error } = await this.rnBiometrics.createSignature({
        promptMessage: "Sign in with biometrics",
        payload,
      })

      if (success && signature) {
        return signature
      } else {
        throw new Error(error || "Failed to create signature")
      }
    } catch (error) {
      console.error("Error creating biometric signature:", error)
      return null
    }
  }

  showBiometricPrompt(title: string, subtitle: string, onSuccess: () => void, onError: (error: string) => void): void {
    if (Platform.OS === "android") {
      Alert.alert(title, subtitle, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Authenticate",
          onPress: async () => {
            try {
              const success = await this.authenticate(subtitle)
              if (success) {
                onSuccess()
              } else {
                onError("Authentication failed")
              }
            } catch (error) {
              onError(error instanceof Error ? error.message : "Authentication failed")
            }
          },
        },
      ])
    } else {
      // iOS handles the prompt automatically
      this.authenticate(subtitle)
        .then((success) => {
          if (success) {
            onSuccess()
          } else {
            onError("Authentication failed")
          }
        })
        .catch((error) => {
          onError(error instanceof Error ? error.message : "Authentication failed")
        })
    }
  }
}
