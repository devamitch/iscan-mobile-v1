import { MMKV } from "react-native-mmkv"
import { initializeApp as initFirebase } from "@react-native-firebase/app"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import Config from "react-native-config"

import { mediaPipeService } from "@/services/mediapipe/MediaPipeService"
import { biometricService } from "@/services/biometric/BiometricService"
import { cameraService } from "@/services/camera/CameraService"
import { permissionsService } from "@/services/permissions/PermissionsService"
import { downloadMediaPipeModels } from "@/utils/modelDownloader"

// Initialize MMKV storage
export const storage = new MMKV({
  id: "aeye-scan-storage",
  encryptionKey: Config.ENCRYPTION_KEY,
})

// Initialize secure storage for sensitive data
export const secureStorage = new MMKV({
  id: "aeye-scan-secure",
  encryptionKey: Config.ENCRYPTION_KEY,
})

export const initializeApp = async (): Promise<void> => {
  try {
    console.log("🔧 Starting app initialization...")

    // Initialize Firebase
    await initFirebase()
    console.log("✅ Firebase initialized")

    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: "",
      forceCodeForRefreshToken: true,
    })
    console.log("✅ Google Sign-In configured")

    // Request essential permissions
    await permissionsService.requestEssentialPermissions()
    console.log("✅ Essential permissions requested")

    // Initialize camera service
    await cameraService.initialize()
    console.log("✅ Camera service initialized")

    // Initialize biometric service
    await biometricService.initialize()
    console.log("✅ Biometric service initialized")

    // Download MediaPipe models if needed
    await downloadMediaPipeModels()
    console.log("✅ MediaPipe models ready")

    // Initialize MediaPipe service
    await mediaPipeService.initialize({
      enableFaceDetection: true,
      enableFaceMesh: true,
      enableHandTracking: true,
      enablePoseEstimation: true,
      enableHolistic: true,
      enableSelfieSegmentation: true,
      enableObjectDetection: true,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    })
    console.log("✅ MediaPipe service initialized")

    console.log("🎉 App initialization completed successfully")
  } catch (error) {
    console.error("❌ App initialization failed:", error)
    throw error
  }
}
