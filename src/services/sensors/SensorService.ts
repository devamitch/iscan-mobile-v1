import { accelerometer, gyroscope, magnetometer, setUpdateIntervalForType, SensorTypes } from "react-native-sensors"
import { DeviceMotion } from "expo-sensors"
import type { Subscription } from "rxjs"

export interface Vector3D {
  x: number
  y: number
  z: number
  timestamp: number
}

export interface Orientation {
  pitch: number
  roll: number
  yaw: number
  timestamp: number
}

export interface ProximityData {
  distance: number
  timestamp: number
}

export interface LightData {
  illuminance: number
  timestamp: number
}

export interface SensorData {
  accelerometer: Vector3D
  gyroscope: Vector3D
  magnetometer: Vector3D
  orientation: Orientation
  proximity: ProximityData
  lightSensor: LightData
}

export class SensorService {
  private isInitialized = false
  private subscriptions: Subscription[] = []
  private sensorDataCallbacks: Array<(data: SensorData) => void> = []
  private currentSensorData: SensorData = {
    accelerometer: { x: 0, y: 0, z: 0, timestamp: 0 },
    gyroscope: { x: 0, y: 0, z: 0, timestamp: 0 },
    magnetometer: { x: 0, y: 0, z: 0, timestamp: 0 },
    orientation: { pitch: 0, roll: 0, yaw: 0, timestamp: 0 },
    proximity: { distance: 0, timestamp: 0 },
    lightSensor: { illuminance: 0, timestamp: 0 },
  }

  async initialize(): Promise<void> {
    try {
      console.log("🔧 Initializing Sensor Service...")

      // Set update intervals
      setUpdateIntervalForType(SensorTypes.accelerometer, 100) // 10Hz
      setUpdateIntervalForType(SensorTypes.gyroscope, 100)
      setUpdateIntervalForType(SensorTypes.magnetometer, 100)

      this.isInitialized = true
      console.log("✅ Sensor Service initialized")
    } catch (error) {
      console.error("❌ Sensor Service initialization failed:", error)
      throw error
    }
  }

  async startSensors(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Sensor Service not initialized")
    }

    try {
      // Start accelerometer
      const accelerometerSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
        this.currentSensorData.accelerometer = { x, y, z, timestamp }
        this.notifyCallbacks()
      })
      this.subscriptions.push(accelerometerSubscription)

      // Start gyroscope
      const gyroscopeSubscription = gyroscope.subscribe(({ x, y, z, timestamp }) => {
        this.currentSensorData.gyroscope = { x, y, z, timestamp }
        this.notifyCallbacks()
      })
      this.subscriptions.push(gyroscopeSubscription)

      // Start magnetometer
      const magnetometerSubscription = magnetometer.subscribe(({ x, y, z, timestamp }) => {
        this.currentSensorData.magnetometer = { x, y, z, timestamp }
        this.notifyCallbacks()
      })
      this.subscriptions.push(magnetometerSubscription)

      // Start device motion (for orientation)
      DeviceMotion.setUpdateInterval(100)
      const motionSubscription = DeviceMotion.addListener((motionData) => {
        if (motionData.rotation) {
          this.currentSensorData.orientation = {
            pitch: motionData.rotation.beta || 0,
            roll: motionData.rotation.gamma || 0,
            yaw: motionData.rotation.alpha || 0,
            timestamp: Date.now(),
          }
          this.notifyCallbacks()
        }
      })

      console.log("📱 Sensors started")
    } catch (error) {
      console.error("❌ Failed to start sensors:", error)
      throw error
    }
  }

  stopSensors(): void {
    // Unsubscribe from all sensors
    this.subscriptions.forEach((subscription) => subscription.unsubscribe())
    this.subscriptions = []

    // Stop device motion
    DeviceMotion.removeAllListeners()

    console.log("⏹️ Sensors stopped")
  }

  private notifyCallbacks(): void {
    this.sensorDataCallbacks.forEach((callback) => {
      try {
        callback(this.currentSensorData)
      } catch (error) {
        console.error("Sensor data callback error:", error)
      }
    })
  }

  onSensorData(callback: (data: SensorData) => void): () => void {
    this.sensorDataCallbacks.push(callback)

    return () => {
      const index = this.sensorDataCallbacks.indexOf(callback)
      if (index > -1) {
        this.sensorDataCallbacks.splice(index, 1)
      }
    }
  }

  getCurrentSensorData(): SensorData {
    return { ...this.currentSensorData }
  }

  getAccelerometer(): Vector3D {
    return this.currentSensorData.accelerometer
  }

  getGyroscope(): Vector3D {
    return this.currentSensorData.gyroscope
  }

  getMagnetometer(): Vector3D {
    return this.currentSensorData.magnetometer
  }

  getOrientation(): Orientation {
    return this.currentSensorData.orientation
  }

  calculateMotion(): {
    isMoving: boolean
    intensity: number
    direction: Vector3D
  } {
    const { x, y, z } = this.currentSensorData.accelerometer
    const magnitude = Math.sqrt(x * x + y * y + z * z)
    const gravity = 9.81
    const intensity = Math.abs(magnitude - gravity)

    return {
      isMoving: intensity > 0.5,
      intensity,
      direction: { x, y, z, timestamp: Date.now() },
    }
  }

  calculateOrientation(): {
    isPortrait: boolean
    isLandscape: boolean
    rotation: number
  } {
    const { roll } = this.currentSensorData.orientation
    const rotation = Math.abs(roll)

    return {
      isPortrait: rotation < 45 || rotation > 135,
      isLandscape: rotation >= 45 && rotation <= 135,
      rotation,
    }
  }

  dispose(): void {
    this.stopSensors()
    this.sensorDataCallbacks = []
    this.isInitialized = false
    console.log("🧹 Sensor Service disposed")
  }
}
