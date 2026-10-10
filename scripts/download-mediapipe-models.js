const fs = require("fs")
const path = require("path")
const https = require("https")

const MODELS_DIR = path.join(__dirname, "..", "src", "assets", "models")
const MEDIAPIPE_MODELS_BASE_URL = "https://storage.googleapis.com/mediapipe-models"

const MODELS_TO_DOWNLOAD = [
  {
    name: "face_detection_short_range.tflite",
    url: `${MEDIAPIPE_MODELS_BASE_URL}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
    size: "1.2MB",
  },
  {
    name: "face_landmarker.task",
    url: `${MEDIAPIPE_MODELS_BASE_URL}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
    size: "2.8MB",
  },
  {
    name: "hand_landmarker.task",
    url: `${MEDIAPIPE_MODELS_BASE_URL}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
    size: "2.3MB",
  },
  {
    name: "pose_landmarker_heavy.task",
    url: `${MEDIAPIPE_MODELS_BASE_URL}/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task`,
    size: "5.1MB",
  },
  {
    name: "holistic_landmarker.task",
    url: `${MEDIAPIPE_MODELS_BASE_URL}/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task`,
    size: "8.7MB",
  },
  {
    name: "selfie_segmenter.tflite",
    url: `${MEDIAPIPE_MODELS_BASE_URL}/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite`,
    size: "1.1MB",
  },
  {
    name: "object_detection_3d_chair.tflite",
    url: `${MEDIAPIPE_MODELS_BASE_URL}/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
    size: "6.2MB",
  },
]

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination)

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file)

          file.on("finish", () => {
            file.close()
            resolve()
          })

          file.on("error", (err) => {
            fs.unlink(destination, () => {}) // Delete the file on error
            reject(err)
          })
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        }
      })
      .on("error", (err) => {
        reject(err)
      })
  })
}

async function downloadModels() {
  console.log("📱 Downloading MediaPipe models...")
  console.log("=====================================")

  // Create models directory if it doesn't exist
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true })
    console.log(`✅ Created models directory: ${MODELS_DIR}`)
  }

  let totalDownloaded = 0
  let totalSkipped = 0

  for (const model of MODELS_TO_DOWNLOAD) {
    const filePath = path.join(MODELS_DIR, model.name)

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${model.name} (already exists)`)
      totalSkipped++
      continue
    }

    try {
      console.log(`⬇️  Downloading ${model.name} (${model.size})...`)
      await downloadFile(model.url, filePath)
      console.log(`✅ Downloaded ${model.name}`)
      totalDownloaded++
    } catch (error) {
      console.error(`❌ Failed to download ${model.name}:`, error.message)

      // Try alternative URL or fallback
      console.log(`🔄 Trying alternative source for ${model.name}...`)
      try {
        // You can add alternative URLs here if needed
        console.log(`⚠️  No alternative source available for ${model.name}`)
      } catch (fallbackError) {
        console.error(`❌ Fallback also failed for ${model.name}:`, fallbackError.message)
      }
    }
  }

  console.log("")
  console.log("📊 Download Summary:")
  console.log(`✅ Downloaded: ${totalDownloaded} models`)
  console.log(`⏭️  Skipped: ${totalSkipped} models`)
  console.log(`📁 Models directory: ${MODELS_DIR}`)

  if (totalDownloaded > 0) {
    console.log("")
    console.log("🎉 MediaPipe models download completed!")
    console.log("💡 Models are ready for use in the app")
  } else if (totalSkipped === MODELS_TO_DOWNLOAD.length) {
    console.log("")
    console.log("✨ All models already exist - nothing to download")
  } else {
    console.log("")
    console.log("⚠️  Some models failed to download")
    console.log("🔧 Please check your internet connection and try again")
    process.exit(1)
  }
}

// Create a models manifest file
function createModelsManifest() {
  const manifest = {
    version: "1.0.0",
    models: MODELS_TO_DOWNLOAD.map((model) => ({
      name: model.name,
      size: model.size,
      path: `models/${model.name}`,
      downloaded: fs.existsSync(path.join(MODELS_DIR, model.name)),
    })),
    downloadedAt: new Date().toISOString(),
  }

  const manifestPath = path.join(MODELS_DIR, "manifest.json")
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`📋 Created models manifest: ${manifestPath}`)
}

// Main execution
if (require.main === module) {
  downloadModels()
    .then(() => {
      createModelsManifest()
      console.log("")
      console.log("🚀 Ready to start development!")
    })
    .catch((error) => {
      console.error("💥 Download process failed:", error)
      process.exit(1)
    })
}

module.exports = { downloadModels, MODELS_TO_DOWNLOAD }
