import Config from "react-native-config"

export const API_CONFIG = {
  BASE_URL: Config.API_BASE_URL || "https://api.aeye-scan.com/api/v1",
  SOCKET_URL: Config.SOCKET_URL || "wss://socket.aeye-scan.com",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const

export const AI_CONFIG = {
  OPENAI_API_KEY: Config.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: Config.ANTHROPIC_API_KEY,
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
} as const

export const MEDIAPIPE_CONFIG = {
  MODELS_URL: Config.MEDIAPIPE_MODELS_URL || "https://storage.googleapis.com/mediapipe-models",
  MODEL_COMPLEXITY: 1,
  MIN_DETECTION_CONFIDENCE: 0.7,
  MIN_TRACKING_CONFIDENCE: 0.5,
} as const

export const BIOMETRIC_CONFIG = {
  FACE_DETECTION_CONFIDENCE: 0.8,
  IRIS_RECOGNITION_THRESHOLD: 0.9,
  HAND_TRACKING_CONFIDENCE: 0.7,
  POSE_ESTIMATION_CONFIDENCE: 0.6,
} as const

export const CAMERA_CONFIG = {
  DEFAULT_QUALITY: "hd" as const,
  MAX_DURATION: 60000, // 60 seconds
  ENABLE_AUDIO: true,
  PHOTO_QUALITY: 0.8,
} as const

export const STORAGE_KEYS = {
  USER_TOKEN: "user_token",
  REFRESH_TOKEN: "refresh_token",
  USER_PROFILE: "user_profile",
  THEME_MODE: "theme_mode",
  BIOMETRIC_ENABLED: "biometric_enabled",
  ONBOARDING_COMPLETED: "onboarding_completed",
  LANGUAGE: "language",
  NOTIFICATIONS_ENABLED: "notifications_enabled",
} as const

export const FEATURE_FLAGS = {
  ENABLE_AI_FEATURES: Config.ENABLE_AI_FEATURES === "true",
  ENABLE_AR_FEATURES: Config.ENABLE_AR_FEATURES === "true",
  ENABLE_BIOMETRIC_AUTH: Config.ENABLE_BIOMETRIC_AUTH === "true",
  ENABLE_OFFLINE_MODE: Config.ENABLE_OFFLINE_MODE === "true",
} as const

export const ANIMATION_CONFIG = {
  DURATION: {
    SHORT: 200,
    MEDIUM: 400,
    LONG: 600,
  },
  EASING: {
    EASE_IN: "easeIn",
    EASE_OUT: "easeOut",
    EASE_IN_OUT: "easeInOut",
    BOUNCE: "bounce",
    SPRING: "spring",
  },
} as const

export const THEME_CONFIG = {
  GLASSMORPHISM: {
    BLUR_RADIUS: 20,
    OPACITY: 0.1,
    BORDER_OPACITY: 0.2,
  },
  GRADIENT: {
    PRIMARY: ["#667eea", "#764ba2"],
    SECONDARY: ["#f093fb", "#f5576c"],
    ACCENT: ["#4facfe", "#00f2fe"],
    DARK: ["#2c3e50", "#34495e"],
  },
} as const

export const SCAN_TYPES = {
  FACE: "face",
  IRIS: "iris",
  HAND: "hand",
  POSE: "pose",
  HOLISTIC: "holistic",
  DOCUMENT: "document",
  OBJECT: "object",
} as const

export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  CAMERA_ERROR: "CAMERA_ERROR",
  MEDIAPIPE_ERROR: "MEDIAPIPE_ERROR",
  BIOMETRIC_ERROR: "BIOMETRIC_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
} as const
