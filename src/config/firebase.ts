import analytics, { type FirebaseAnalyticsTypes } from "@react-native-firebase/analytics"
import { initializeApp } from "@react-native-firebase/app"
import auth, { type FirebaseAuthTypes } from "@react-native-firebase/auth"
import crashlytics, { type FirebaseCrashlyticsTypes } from "@react-native-firebase/crashlytics"
import firestore, { type FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
// import messaging, { type FirebaseMessagingTypes } from "@react-native-firebase/messaging"
// import perf, { type FirebasePerfTypes } from "@react-native-firebase/perf"
// import remoteConfig, { type FirebaseRemoteConfigTypes } from "@react-native-firebase/remote-config"
// import storage, { type FirebaseStorageTypes } from "@react-native-firebase/storage"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:android:abcdef",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ",
}

// Initialize Firebase
let app: any

try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.error("Firebase initialization error:", error)
  throw error
}

// Firebase services
export const firebaseAuth = auth()
export const firebaseFirestore = firestore()
// export const firebaseStorage = storage()
export const firebaseAnalytics = analytics()
export const firebaseCrashlytics = crashlytics()
// export const firebaseMessaging = messaging()
// export const firebaseRemoteConfig = remoteConfig()
// export const firebasePerf = perf()


// Types
type FirebaseMessagingTypes = any;
type FirebasePerfTypes = any; 
type FirebaseRemoteConfigTypes = any;
type  FirebaseStorageTypes = any;
   
export type {
  FirebaseAnalyticsTypes, FirebaseAuthTypes, FirebaseCrashlyticsTypes, FirebaseFirestoreTypes,
  FirebaseMessagingTypes,
  FirebasePerfTypes,
  FirebaseRemoteConfigTypes,
  FirebaseStorageTypes
}

export default app
