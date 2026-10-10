import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'
import jest from 'jest'
import 'react-native-gesture-handler/jestSetup'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

// Mock MMKV
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    contains: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}))

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}))

// Mock Biometrics
jest.mock('react-native-biometrics', () => ({
  BiometryTypes: {
    TouchID: 'TouchID',
    FaceID: 'FaceID',
    Biometrics: 'Biometrics',
  },
  isSensorAvailable: jest.fn(() => Promise.resolve({ available: true, biometryType: 'FaceID' })),
  simplePrompt: jest.fn(() => Promise.resolve({ success: true })),
}))

// Mock React Native Config
jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://api.test.com',
  OPENAI_API_KEY: 'test-key',
  FIREBASE_API_KEY: 'test-firebase-key',
}))

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  utils: () => ({
    FilePath: {
      PICTURES_DIRECTORY: '/pictures',
    },
  }),
}))

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
  }),
}))

// Mock MediaPipe
jest.mock('@mediapipe/face_detection', () => ({
  FaceDetection: {
    createFromOptions: jest.fn(() =>
      Promise.resolve({
        detectForVideo: jest.fn(() => Promise.resolve({ detections: [] })),
        close: jest.fn(),
      }),
    ),
  },
}))

jest.mock('@mediapipe/hands', () => ({
  Hands: {
    createFromOptions: jest.fn(() =>
      Promise.resolve({
        detectForVideo: jest.fn(() => Promise.resolve({ landmarks: [], handednesses: [] })),
        close: jest.fn(),
      }),
    ),
  },
}))

// Mock Camera
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevices: jest.fn(() => ({ front: { id: 'front' }, back: { id: 'back' } })),
  useFrameProcessor: jest.fn(),
}))

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View')
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  }
})

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}))

// Mock Permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      MICROPHONE: 'ios.permission.MICROPHONE',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}))

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
