import { NativeModules, NativeEventEmitter } from "react-native"
import * as THREE from "three"

export interface ARFrame {
  timestamp: number
  camera: {
    position: THREE.Vector3
    rotation: THREE.Quaternion
    projectionMatrix: THREE.Matrix4
  }
  lightEstimate?: {
    ambientIntensity: number
    ambientColorTemperature: number
  }
  anchors: ARanchor[]
}

export interface ARanchor {
  id: string
  transform: THREE.Matrix4
  type: "plane" | "image" | "face" | "body"
  isTracking: boolean
}

export interface ARPlane extends ARanchor {
  type: "plane"
  center: THREE.Vector3
  extent: { width: number; height: number }
  alignment: "horizontal" | "vertical"
}

export class AREngineService {
  private eventEmitter: NativeEventEmitter
  private isInitialized = false
  private isSessionActive = false
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer | null = null
  private anchors: Map<string, ARanchor> = new Map()

  constructor() {
    this.eventEmitter = new NativeEventEmitter(NativeModules.AREngineModule)
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  }

  async initialize(): Promise<void> {
    try {
      console.log("🔧 Initializing AR Engine...")

      // Initialize Three.js renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      })
      this.renderer.setPixelRatio(2)
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

      // Setup lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      this.scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 5)
      directionalLight.castShadow = true
      this.scene.add(directionalLight)

      this.isInitialized = true
      console.log("✅ AR Engine initialized")
    } catch (error) {
      console.error("❌ AR Engine initialization failed:", error)
      throw error
    }
  }

  async startSession(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("AR Engine not initialized")
    }

    try {
      // Start AR session through native module
      await NativeModules.AREngineModule?.startSession()
      this.isSessionActive = true

      // Start frame updates
      this.startFrameUpdates()

      console.log("🎬 AR Session started")
    } catch (error) {
      console.error("❌ Failed to start AR session:", error)
      throw error
    }
  }

  stopSession(): void {
    if (this.isSessionActive) {
      NativeModules.AREngineModule?.stopSession()
      this.isSessionActive = false
      this.anchors.clear()
      console.log("⏹️ AR Session stopped")
    }
  }

  private startFrameUpdates(): void {
    const updateFrame = () => {
      if (this.isSessionActive && this.renderer) {
        // Update camera from AR frame data
        this.updateCameraFromAR()

        // Render the scene
        this.renderer.render(this.scene, this.camera)

        requestAnimationFrame(updateFrame)
      }
    }
    updateFrame()
  }

  private updateCameraFromAR(): void {
    // This would be updated with real AR frame data
    // For now, we'll simulate camera movement
    const time = Date.now() * 0.001
    this.camera.position.set(Math.sin(time) * 0.1, 0, Math.cos(time) * 0.1)
  }

  addAnchor(anchor: ARanchor): void {
    this.anchors.set(anchor.id, anchor)

    // Add visual representation to scene
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
    })
    const mesh = new THREE.Mesh(geometry, material)

    // Apply anchor transform
    mesh.applyMatrix4(anchor.transform)
    mesh.userData = { anchorId: anchor.id }

    this.scene.add(mesh)
  }

  removeAnchor(anchorId: string): void {
    this.anchors.delete(anchorId)

    // Remove from scene
    const objectToRemove = this.scene.children.find((child) => child.userData.anchorId === anchorId)
    if (objectToRemove) {
      this.scene.remove(objectToRemove)
    }
  }

  getAnchors(): ARanchor[] {
    return Array.from(this.anchors.values())
  }

  addObject(object: THREE.Object3D, anchorId?: string): void {
    if (anchorId && this.anchors.has(anchorId)) {
      const anchor = this.anchors.get(anchorId)!
      object.applyMatrix4(anchor.transform)
    }
    this.scene.add(object)
  }

  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  onFrameUpdate(callback: (frame: ARFrame) => void): () => void {
    const subscription = this.eventEmitter.addListener("ARFrameUpdate", callback)
    return () => subscription.remove()
  }

  onAnchorAdded(callback: (anchor: ARanchor) => void): () => void {
    const subscription = this.eventEmitter.addListener("ARAnchorAdded", callback)
    return () => subscription.remove()
  }

  onAnchorRemoved(callback: (anchorId: string) => void): () => void {
    const subscription = this.eventEmitter.addListener("ARAnchorRemoved", callback)
    return () => subscription.remove()
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer
  }

  dispose(): void {
    this.stopSession()
    this.renderer?.dispose()
    this.scene.clear()
    this.anchors.clear()
    this.isInitialized = false
    console.log("🧹 AR Engine disposed")
  }
}
