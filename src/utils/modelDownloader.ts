import RNFS from "react-native-fs"
import { unzip } from "react-native-zip-archive"

export interface ModelInfo {
  name: string
  url: string
  version: string
  size: number
  checksum?: string
}

export interface DownloadProgress {
  bytesWritten: number
  contentLength: number
  progress: number
}

class ModelDownloader {
  private modelsDir: string
  private downloadPromises: Map<string, Promise<string>> = new Map()

  constructor() {
    this.modelsDir = `${RNFS.DocumentDirectoryPath}/models`
    this.ensureModelsDirectory()
  }

  private async ensureModelsDirectory(): Promise<void> {
    try {
      const exists = await RNFS.exists(this.modelsDir)
      if (!exists) {
        await RNFS.mkdir(this.modelsDir)
      }
    } catch (error) {
      console.error("Error creating models directory:", error)
    }
  }

  async downloadModel(modelInfo: ModelInfo, onProgress?: (progress: DownloadProgress) => void): Promise<string> {
    const { name, url, version, checksum } = modelInfo
    const modelPath = `${this.modelsDir}/${name}_${version}`
    const zipPath = `${modelPath}.zip`

    // Check if already downloading
    if (this.downloadPromises.has(name)) {
      return this.downloadPromises.get(name)!
    }

    // Check if model already exists
    const exists = await RNFS.exists(modelPath)
    if (exists) {
      console.log(`Model ${name} already exists`)
      return modelPath
    }

    const downloadPromise = this.performDownload(url, zipPath, modelPath, checksum, onProgress)

    this.downloadPromises.set(name, downloadPromise)

    try {
      const result = await downloadPromise
      this.downloadPromises.delete(name)
      return result
    } catch (error) {
      this.downloadPromises.delete(name)
      throw error
    }
  }

  private async performDownload(
    url: string,
    zipPath: string,
    extractPath: string,
    checksum?: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<string> {
    try {
      console.log(`Downloading model from ${url}`)

      // Download the model
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: zipPath,
        progress: (res) => {
          if (onProgress) {
            onProgress({
              bytesWritten: res.bytesWritten,
              contentLength: res.contentLength,
              progress: res.bytesWritten / res.contentLength,
            })
          }
        },
      }).promise

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Download failed with status ${downloadResult.statusCode}`)
      }

      // Verify checksum if provided
      if (checksum) {
        const fileChecksum = await this.calculateChecksum(zipPath)
        if (fileChecksum !== checksum) {
          await RNFS.unlink(zipPath)
          throw new Error("Checksum verification failed")
        }
      }

      // Extract the model
      await unzip(zipPath, extractPath)

      // Clean up zip file
      await RNFS.unlink(zipPath)

      console.log(`Model extracted to ${extractPath}`)
      return extractPath
    } catch (error) {
      // Clean up on error
      try {
        await RNFS.unlink(zipPath)
        await RNFS.unlink(extractPath)
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError)
      }
      throw error
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      return await RNFS.hash(filePath, "sha256")
    } catch (error) {
      console.error("Checksum calculation error:", error)
      return ""
    }
  }

  async getModelPath(name: string, version: string): Promise<string | null> {
    const modelPath = `${this.modelsDir}/${name}_${version}`
    const exists = await RNFS.exists(modelPath)
    return exists ? modelPath : null
  }

  async deleteModel(name: string, version: string): Promise<void> {
    const modelPath = `${this.modelsDir}/${name}_${version}`
    const exists = await RNFS.exists(modelPath)
    if (exists) {
      await RNFS.unlink(modelPath)
      console.log(`Model ${name}_${version} deleted`)
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const files = await RNFS.readDir(this.modelsDir)
      return files.filter((file) => file.isDirectory()).map((file) => file.name)
    } catch (error) {
      console.error("Error listing models:", error)
      return []
    }
  }

  async getModelSize(name: string, version: string): Promise<number> {
    const modelPath = `${this.modelsDir}/${name}_${version}`
    try {
      const stat = await RNFS.stat(modelPath)
      return stat.size
    } catch (error) {
      return 0
    }
  }

  async getTotalModelsSize(): Promise<number> {
    try {
      const models = await this.listModels()
      const sizes = await Promise.all(
        models.map(async (model) => {
          const [name, version] = model.split("_")
          return this.getModelSize(name, version)
        }),
      )
      return sizes.reduce((total, size) => total + size, 0)
    } catch (error) {
      console.error("Error calculating total models size:", error)
      return 0
    }
  }
}

export const modelDownloader = new ModelDownloader()

// Predefined models for MediaPipe
export const MEDIAPIPE_MODELS: ModelInfo[] = [
  {
    name: "face_detection",
    url: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
    version: "1.0.0",
    size: 1024 * 1024, // 1MB
  },
  {
    name: "face_landmark",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    version: "1.0.0",
    size: 2 * 1024 * 1024, // 2MB
  },
  {
    name: "hand_landmark",
    url: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    version: "1.0.0",
    size: 3 * 1024 * 1024, // 3MB
  },
  {
    name: "pose_landmark",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
    version: "1.0.0",
    size: 5 * 1024 * 1024, // 5MB
  },
]
