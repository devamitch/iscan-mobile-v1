import messaging from "@react-native-firebase/messaging"
import { Platform, PermissionsAndroid } from "react-native"
import PushNotification from "react-native-push-notification"

export interface NotificationConfig {
  title: string
  body: string
  data?: Record<string, any>
  sound?: string
  badge?: number
  priority?: "high" | "normal" | "low"
  category?: string
  actions?: NotificationAction[]
}

export interface NotificationAction {
  id: string
  title: string
  icon?: string
}

export interface FCMToken {
  token: string
  timestamp: number
}

export class NotificationService {
  private isInitialized = false
  private fcmToken: string | null = null

  async initialize(): Promise<void> {
    try {
      console.log("🔧 Initializing Notification Service...")

      // Configure push notifications
      PushNotification.configure({
        onRegister: (token) => {
          console.log("Push notification token:", token)
        },
        onNotification: (notification) => {
          console.log("Notification received:", notification)
        },
        onAction: (notification) => {
          console.log("Notification action:", notification)
        },
        onRegistrationError: (err) => {
          console.error("Push notification registration error:", err)
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: Platform.OS === "ios",
      })

      // Initialize Firebase messaging
      await this.initializeFirebaseMessaging()

      this.isInitialized = true
      console.log("✅ Notification Service initialized")
    } catch (error) {
      console.error("❌ Notification Service initialization failed:", error)
      throw error
    }
  }

  private async initializeFirebaseMessaging(): Promise<void> {
    try {
      // Request permission for iOS
      if (Platform.OS === "ios") {
        const authStatus = await messaging().requestPermission()
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL

        if (!enabled) {
          throw new Error("Push notification permission denied")
        }
      }

      // Get FCM token
      this.fcmToken = await messaging().getToken()
      console.log("FCM Token:", this.fcmToken)

      // Listen for token refresh
      messaging().onTokenRefresh((token) => {
        this.fcmToken = token
        console.log("FCM Token refreshed:", token)
      })

      // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log("Background message:", remoteMessage)
      })

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        console.log("Foreground message:", remoteMessage)

        if (remoteMessage.notification) {
          this.showLocalNotification({
            title: remoteMessage.notification.title || "",
            body: remoteMessage.notification.body || "",
            data: remoteMessage.data,
          })
        }
      })
    } catch (error) {
      console.error("Firebase messaging initialization error:", error)
      throw error
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
        return granted
      } else {
        const authStatus = await messaging().hasPermission()
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        )
      }
    } catch (error) {
      console.error("Error checking notification permission:", error)
      return false
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
        return granted === PermissionsAndroid.RESULTS.GRANTED
      } else {
        const authStatus = await messaging().requestPermission()
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        )
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }

  async showNotification(config: NotificationConfig): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Notification Service not initialized")
    }

    try {
      await this.showLocalNotification(config)
    } catch (error) {
      console.error("Error showing notification:", error)
      throw error
    }
  }

  private async showLocalNotification(config: NotificationConfig): Promise<void> {
    PushNotification.localNotification({
      title: config.title,
      message: config.body,
      userInfo: config.data,
      soundName: config.sound || "default",
      number: config.badge,
      priority: config.priority || "high",
      category: config.category,
      actions: config.actions?.map((action) => action.title) || [],
    })
  }

  async scheduleNotification(config: NotificationConfig, date: Date): Promise<string> {
    if (!this.isInitialized) {
      throw new Error("Notification Service not initialized")
    }

    try {
      const id = Date.now().toString()

      PushNotification.localNotificationSchedule({
        id,
        title: config.title,
        message: config.body,
        date,
        userInfo: config.data,
        soundName: config.sound || "default",
        number: config.badge,
        priority: config.priority || "high",
        category: config.category,
        actions: config.actions?.map((action) => action.title) || [],
      })

      return id
    } catch (error) {
      console.error("Error scheduling notification:", error)
      throw error
    }
  }

  async cancelNotification(id: string): Promise<void> {
    try {
      PushNotification.cancelLocalNotifications({ id })
    } catch (error) {
      console.error("Error canceling notification:", error)
      throw error
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      PushNotification.cancelAllLocalNotifications()
    } catch (error) {
      console.error("Error canceling all notifications:", error)
      throw error
    }
  }

  getFCMToken(): string | null {
    return this.fcmToken
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic)
      console.log(`Subscribed to topic: ${topic}`)
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error)
      throw error
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic)
      console.log(`Unsubscribed from topic: ${topic}`)
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error)
      throw error
    }
  }

  dispose(): void {
    PushNotification.abandonPermissions()
    this.isInitialized = false
    console.log("🧹 Notification Service disposed")
  }
}
