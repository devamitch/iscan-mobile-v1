import { NativeModules, NativeEventEmitter } from "react-native"
import {
  FaceDetector,
  FaceLandmarker,
  HandLandmarker,
  PoseLandmarker,
  HolisticLandmarker,
  ImageSegmenter,
  ObjectDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision"

export interface MediaPipeConfig {
  enableFaceDetection: boolean
  enableFaceMesh: boolean
  enableHandTracking: boolean
  enablePoseEstimation: boolean
  enableHolistic: boolean
  enableSelfieSegmentation: boolean
  enableObjectDetection: boolean
  modelComplexity: 0 | 1 | 2
  minDetectionConfidence: number
  minTrackingConfidence: number
}

export interface FaceDetectionResult {
  detections: Array<{
    boundingBox: {
      x: number
      y: number
      width: number
      height: number
    }
    keypoints: Array<{
      x: number
      y: number
      z?: number
    }>
    confidence: number
  }>
}

export interface HandTrackingResult {
  landmarks: Array<{
    x: number
    y: number
    z: number
  }>
  handedness: "Left" | "Right"
  confidence: number
}

export interface PoseEstimationResult {
  landmarks: Array<{
    x: number
    y: number
    z: number
    visibility: number
  }>
  confidence: number
}

export interface HolisticResult {
  faceLandmarks?: Array<{ x: number; y: number; z: number }>
  poseLandmarks?: Array<{ x: number; y: number; z: number; visibility: number }>
  leftHandLandmarks?: Array<{ x: number; y: number; z: number }>
  rightHandLandmarks?: Array<{ x: number; y: number; z: number }>
}

class MediaPipeService {
  private faceDetector?: FaceDetector
  private faceLandmarker?: FaceLandmarker
  private handLandmarker?: HandLandmarker
  private poseLandmarker?: PoseLandmarker
  private holisticLandmarker?: HolisticLandmarker
  private imageSegmenter?: ImageSegmenter
  private objectDetector?: ObjectDetector
  private eventEmitter: NativeEventEmitter
  private isInitialized = false
  private vision?: any

  constructor() {
    this.eventEmitter = new NativeEventEmitter(NativeModules.MediaPipeModule)
  }

  async initialize(config: MediaPipeConfig): Promise<void> {
    try {
      console.log("🔧 Initializing MediaPipe services...")

      // Initialize the vision tasks
      this.vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm",
      )

      // Initialize Face Detection
      if (config.enableFaceDetection) {
        this.faceDetector = await FaceDetector.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: "models/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: config.minDetectionConfidence,
        })
        console.log("✅ Face Detection initialized")
      }

      // Initialize Face Mesh
      if (config.enableFaceMesh) {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: "models/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: config.minDetectionConfidence,
          minFacePresenceConfidence: config.minTrackingConfidence,
          minTrackingConfidence: config.minTrackingConfidence,
        })
        console.log("✅ Face Mesh initialized")
      }

      // Initialize Hand Tracking
      if (config.enableHandTracking) {
        this.handLandmarker = await HandLandmarker.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: "models/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: config.minDetectionConfidence,
          minHandPresenceConfidence: config.minTrackingConfidence,
          minTrackingConfidence: config.minTrackingConfidence,
        })
        console.log("✅ Hand Tracking initialized")
      }

      // Initialize Pose Estimation
      if (config.enablePoseEstimation) {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: "models/pose_landmarker_heavy.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minPoseDetectionConfidence: config.minDetectionConfidence,
          minPosePresenceConfidence: config.minTrackingConfidence,
          minTrackingConfidence: config.minTrackingConfidence,
        })
        console.log("✅ Pose Estimation initialized")
      }

      // Initialize Holistic
      if (config.enableHolistic) {
        this.holisticLandmarker = await HolisticLandmarker.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: "models/holistic_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minFaceDetectionConfidence: config.minDetectionConfidence,
          minFaceSuppressionThreshold: 0.5,
          minHandDetectionConfidence: config.minDetectionConfidence,
          minHandSuppressionThreshold: 0.5,
          minPoseDetectionConfidence: config.minDetectionConfidence,
          minPoseSuppressionThreshold: 0.5,
        })
        console.log("✅ Holistic initialized")
      }

      // Initialize Selfie Segmentation
      if (config.enableSelfieSegmentation) {
        this.imageSegmenter = await ImageSegmenter.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: "models/selfie_segmenter.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        })
        console.log("✅ Selfie Segmentation initialized")
      }

      // Initialize Object Detection
      if (config.enableObjectDetection) {
        this.objectDetector = await ObjectDetector.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: "models/efficientdet_lite0.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          maxResults: 5,
          scoreThreshold: config.minDetectionConfidence,
        })
        console.log("✅ Object Detection initialized")
      }

      this.isInitialized = true
      console.log("🎉 MediaPipe initialization completed")
    } catch (error) {
      console.error("❌ MediaPipe initialization failed:", error)
      throw error
    }
  }

  async detectFaces(
    imageData: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    timestamp: number,
  ): Promise<FaceDetectionResult> {
    if (!this.faceDetector || !this.isInitialized) {
      throw new Error("Face Detection not initialized")
    }

    try {
      const results = await this.faceDetector.detectForVideo(imageData, timestamp)

      return {
        detections: results.detections.map((detection) => ({
          boundingBox: {
            x: detection.boundingBox.originX,
            y: detection.boundingBox.originY,
            width: detection.boundingBox.width,
            height: detection.boundingBox.height,
          },
          keypoints:
            detection.keypoints?.map((kp) => ({
              x: kp.x,
              y: kp.y,
              z: kp.z,
            })) || [],
          confidence: detection.categories[0]?.score || 0,
        })),
      }
    } catch (error) {
      console.error("Face detection error:", error)
      throw error
    }
  }

  async trackHands(
    imageData: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    timestamp: number,
  ): Promise<HandTrackingResult[]> {
    if (!this.handLandmarker || !this.isInitialized) {
      throw new Error("Hand Tracking not initialized")
    }

    try {
      const results = await this.handLandmarker.detectForVideo(imageData, timestamp)

      return results.landmarks.map((landmarks, index) => ({
        landmarks: landmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        })),
        handedness: results.handednesses[index]?.[0]?.categoryName as "Left" | "Right",
        confidence: results.handednesses[index]?.[0]?.score || 0,
      }))
    } catch (error) {
      console.error("Hand tracking error:", error)
      throw error
    }
  }

  async estimatePose(
    imageData: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    timestamp: number,
  ): Promise<PoseEstimationResult> {
    if (!this.poseLandmarker || !this.isInitialized) {
      throw new Error("Pose Estimation not initialized")
    }

    try {
      const results = await this.poseLandmarker.detectForVideo(imageData, timestamp)

      return {
        landmarks:
          results.landmarks[0]?.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility || 0,
          })) || [],
        confidence: results.landmarks[0] ? 1.0 : 0.0,
      }
    } catch (error) {
      console.error("Pose estimation error:", error)
      throw error
    }
  }

  async processHolistic(
    imageData: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    timestamp: number,
  ): Promise<HolisticResult> {
    if (!this.holisticLandmarker || !this.isInitialized) {
      throw new Error("Holistic not initialized")
    }

    try {
      const results = await this.holisticLandmarker.detectForVideo(imageData, timestamp)

      return {
        faceLandmarks: results.faceLandmarks[0]?.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        })),
        poseLandmarks: results.poseLandmarks[0]?.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility || 0,
        })),
        leftHandLandmarks: results.leftHandLandmarks[0]?.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        })),
        rightHandLandmarks: results.rightHandLandmarks[0]?.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        })),
      }
    } catch (error) {
      console.error("Holistic processing error:", error)
      throw error
    }
  }

  async segmentSelfie(
    imageData: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    timestamp: number,
  ): Promise<ImageData> {
    if (!this.imageSegmenter || !this.isInitialized) {
      throw new Error("Selfie Segmentation not initialized")
    }

    try {
      const results = await this.imageSegmenter.segmentForVideo(imageData, timestamp)
      return results.confidenceMasks[0]
    } catch (error) {
      console.error("Selfie segmentation error:", error)
      throw error
    }
  }

  onResults(callback: (results: any) => void): () => void {
    const subscription = this.eventEmitter.addListener("MediaPipeResults", callback)
    return () => subscription.remove()
  }

  dispose(): void {
    this.faceDetector?.close()
    this.faceLandmarker?.close()
    this.handLandmarker?.close()
    this.poseLandmarker?.close()
    this.holisticLandmarker?.close()
    this.imageSegmenter?.close()
    this.objectDetector?.close()
    this.isInitialized = false
    console.log("🧹 MediaPipe services disposed")
  }
}

export const mediaPipeService = new MediaPipeService()
