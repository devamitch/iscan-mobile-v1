import type React from "react"
import { Camera } from "react-native-vision-camera"
import { runOnJS } from "react-native-reanimated"

export interface CameraConfig {
  facing: "front" | "back"
  resolution: "low" | "medium" | "high" | "max"
  fps: number
  enableHDR: boolean
  enableNightMode: boolean
  enablePortraitMode: boolean
  format?: "yuv" | "rgb"
}

export interface CameraFrame {
  width: number
  height: number
  bytesPerRow: number
  pixelFormat: string
  timestamp: number
  orientation: "portrait" | "landscape"
}

export interface PhotoResult {
  path: string
  width: number
  height: number
  orientation: number
  isMirrored: boolean
}

export interface VideoResult {
  path: string
  duration: number
  size: number
}

const defaultConfig: CameraConfig = {
  facing: "back",
  resolution: "high",
  fps: 30,
  enableHDR: false,
  enableNightMode: false,
  enablePortraitMode: false,
  format: "yuv",
}

export class CameraService {
  private camera: React.RefObject<Camera> | null = null
  private isInitialized = false
  private isRecording = false
  private frameProcessors: Array<(frame: CameraFrame) => void> = []
  private config: CameraConfig = defaultConfig

  async initialize(): Promise<void> {
    try {
      console.log("🔧 Initializing Camera Service...")
      this.isInitialized = true
      console.log("✅ Camera Service initialized")
    } catch (error) {
      console.error("❌ Camera Service initialization failed:", error)
      throw error
    }
  }

  async checkCameraPermission(): Promise<boolean> {
    try {
      const permission = await Camera.getCameraPermissionStatus()
      return permission === "authorized"
    } catch (error) {
      console.error("Error checking camera permission:", error)
      return false
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const permission = await Camera.requestCameraPermission()
      return permission === "authorized"
    } catch (error) {
      console.error("Error requesting camera permission:", error)
      return false
    }
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const permission = await Camera.getMicrophonePermissionStatus()
      return permission === "authorized"
    } catch (error) {
      console.error("Error checking microphone permission:", error)
      return false
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const permission = await Camera.requestMicrophonePermission()
      return permission === "authorized"
    } catch (error) {
      console.error("Error requesting microphone permission:", error)
      return false
    }
  }

  async startCamera(config: CameraConfig = defaultConfig): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Camera Service not initialized")
    }

    try {
      this.config = { ...defaultConfig, ...config }
      console.log("📹 Camera started with config:", this.config)
    } catch (error) {
      console.error("❌ Failed to start camera:", error)
      throw error
    }
  }

  stopCamera(): void {
    if (this.isRecording) {
      this.stopRecording()
    }
    console.log("⏹️ Camera stopped")
  }

  async takePhoto(): Promise<PhotoResult> {
    if (!this.camera?.current) {
      throw new Error("Camera not available")
    }

    try {
      const photo = await this.camera.current.takePhoto({
        qualityPrioritization: "quality",
        enableAutoRedEyeReduction: true,
        enableAutoStabilization: true,
        enableShutterSound: true,
      })

      return {
        path: photo.path,
        width: photo.width,
        height: photo.height,
        orientation: photo.orientation,
        isMirrored: photo.isMirrored,
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      throw error
    }
  }

  async startRecording(): Promise<void> {
    if (!this.camera?.current) {
      throw new Error("Camera not available")
    }

    if (this.isRecording) {
      throw new Error("Already recording")
    }

    try {
      await this.camera.current.startRecording({
        onRecordingFinished: (video) => {
          console.log("Recording finished:", video)
          this.isRecording = false
        },
        onRecordingError: (error) => {
          console.error("Recording error:", error)
          this.isRecording = false
        },
      })

      this.isRecording = true
      console.log("🎬 Recording started")
    } catch (error) {
      console.error("Error starting recording:", error)
      throw error
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.camera?.current || !this.isRecording) {
      return
    }

    try {
      await this.camera.current.stopRecording()
      this.isRecording = false
      console.log("⏹️ Recording stopped")
    } catch (error) {
      console.error("Error stopping recording:", error)
      throw error
    }
  }

  addFrameProcessor(processor: (frame: CameraFrame) => void): () => void {
    this.frameProcessors.push(processor)

    return () => {
      const index = this.frameProcessors.indexOf(processor)
      if (index > -1) {
        this.frameProcessors.splice(index, 1)
      }
    }
  }

  private processFrame = (frame: any) => {
    "worklet"

    const cameraFrame: CameraFrame = {
      width: frame.width,
      height: frame.height,
      bytesPerRow: frame.bytesPerRow,
      pixelFormat: frame.pixelFormat,
      timestamp: frame.timestamp,
      orientation: frame.orientation,
    }

    runOnJS(() => {
      this.frameProcessors.forEach((processor) => {
        try {
          processor(cameraFrame)
        } catch (error) {
          console.error("Frame processor error:", error)
        }
      })
    })()
  }

  setCameraRef(ref: React.RefObject<Camera>): void {
    this.camera = ref
  }

  getConfig(): CameraConfig {
    return this.config
  }

  isRecordingVideo(): boolean {
    return this.isRecording
  }

  async switchCamera(): Promise<void> {
    this.config.facing = this.config.facing === "front" ? "back" : "front"
    console.log("🔄 Camera switched to:", this.config.facing)
  }

  async setTorch(enabled: boolean): Promise<void> {
    // This would be implemented with the actual camera reference
    console.log("🔦 Torch:", enabled ? "ON" : "OFF")
  }

  async setZoom(factor: number): Promise<void> {
    // This would be implemented with the actual camera reference
    console.log("🔍 Zoom factor:", factor)
  }

  async focus(point: { x: number; y: number }): Promise<void> {
    // This would be implemented with the actual camera reference
    console.log("🎯 Focus point:", point)
  }

  dispose(): void {
    this.stopCamera()
    this.frameProcessors = []
    this.isInitialized = false
    console.log("🧹 Camera Service disposed")
  }
}
