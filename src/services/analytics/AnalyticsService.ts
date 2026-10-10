import { firebaseAnalytics } from '@/config/firebase'
import DeviceInfo from 'react-native-device-info'

export interface AnalyticsEvent {
  name: string
  parameters?: Record<string, any>
  timestamp?: number
}

export interface UserProperties {
  userId?: string
  userType?: 'free' | 'premium' | 'enterprise'
  deviceType?: string
  appVersion?: string
  [key: string]: any
}

export interface AnalyticsConfig {
  enabled: boolean
  debugMode: boolean
  sessionTimeout: number
  batchSize: number
}

class AnalyticsServiceClass {
  private config: AnalyticsConfig = {
    enabled: true,
    debugMode: __DEV__,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    batchSize: 50,
  }

  private eventQueue: AnalyticsEvent[] = []
  private sessionId = ''
  private sessionStartTime = 0
  private isInitialized = false

  async initialize(config?: Partial<AnalyticsConfig>) {
    try {
      if (config) {
        this.config = { ...this.config, ...config }
      }

      // Set analytics collection enabled
      await firebaseAnalytics.setAnalyticsCollectionEnabled(this.config.enabled)

      // Generate session ID
      this.sessionId = await this.generateSessionId()
      this.sessionStartTime = Date.now()

      // Set default user properties
      await this.setDefaultUserProperties()

      // Process queued events
      await this.processEventQueue()

      this.isInitialized = true

      if (this.config.debugMode) {
        console.log('AnalyticsService initialized', {
          sessionId: this.sessionId,
          config: this.config,
        })
      }
    } catch (error) {
      console.error('Failed to initialize AnalyticsService:', error)
    }
  }

  async trackEvent(eventName: string, parameters?: Record<string, any>) {
    try {
      const event: AnalyticsEvent = {
        name: eventName,
        parameters: {
          ...parameters,
          session_id: this.sessionId,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      }

      if (!this.isInitialized) {
        this.eventQueue.push(event)
        return
      }

      await firebaseAnalytics.logEvent(eventName, event.parameters)

      if (this.config.debugMode) {
        console.log('Analytics event tracked:', event)
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  async trackScreenView(screenName: string, screenClass?: string) {
    try {
      await this.trackEvent('screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      })

      await firebaseAnalytics.logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      })
    } catch (error) {
      console.error('Failed to track screen view:', error)
    }
  }

  async setUserProperties(properties: UserProperties) {
    try {
      for (const [key, value] of Object.entries(properties)) {
        await firebaseAnalytics.setUserProperty(key, String(value))
      }

      if (this.config.debugMode) {
        console.log('User properties set:', properties)
      }
    } catch (error) {
      console.error('Failed to set user properties:', error)
    }
  }

  async setUserId(userId: string) {
    try {
      await firebaseAnalytics.setUserId(userId)
      await this.setUserProperties({ userId })
    } catch (error) {
      console.error('Failed to set user ID:', error)
    }
  }

  async trackUserEngagement(action: string, category: string, value?: number) {
    try {
      await this.trackEvent('user_engagement', {
        engagement_action: action,
        engagement_category: category,
        engagement_value: value,
      })
    } catch (error) {
      console.error('Failed to track user engagement:', error)
    }
  }

  async trackError(error: Error, context?: string) {
    try {
      await this.trackEvent('app_error', {
        error_message: error.message,
        error_stack: error.stack,
        error_context: context,
        error_name: error.name,
      })
    } catch (analyticsError) {
      console.error('Failed to track error:', analyticsError)
    }
  }

  async trackPerformance(metric: string, value: number, unit?: string) {
    try {
      await this.trackEvent('performance_metric', {
        metric_name: metric,
        metric_value: value,
        metric_unit: unit || 'ms',
      })
    } catch (error) {
      console.error('Failed to track performance:', error)
    }
  }

  async trackBiometricEvent(eventType: string, biometricType: string, success: boolean) {
    try {
      await this.trackEvent('biometric_event', {
        event_type: eventType,
        biometric_type: biometricType,
        success,
      })
    } catch (error) {
      console.error('Failed to track biometric event:', error)
    }
  }

  async trackScanEvent(scanType: string, duration: number, success: boolean) {
    try {
      await this.trackEvent('scan_event', {
        scan_type: scanType,
        scan_duration: duration,
        scan_success: success,
      })
    } catch (error) {
      console.error('Failed to track scan event:', error)
    }
  }

  async startSession() {
    try {
      this.sessionId = await this.generateSessionId()
      this.sessionStartTime = Date.now()

      await this.trackEvent('session_start', {
        session_id: this.sessionId,
      })
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  async endSession() {
    try {
      const sessionDuration = Date.now() - this.sessionStartTime

      await this.trackEvent('session_end', {
        session_id: this.sessionId,
        session_duration: sessionDuration,
      })
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  private async generateSessionId(): Promise<string> {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return `${timestamp}_${random}`
  }

  private async setDefaultUserProperties() {
    try {
      const deviceInfo = {
        deviceType: await DeviceInfo.getDeviceType(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
      }

      await this.setUserProperties(deviceInfo)
    } catch (error) {
      console.error('Failed to set default user properties:', error)
    }
  }

  private async processEventQueue() {
    try {
      for (const event of this.eventQueue) {
        await firebaseAnalytics.logEvent(event.name, event.parameters)
      }
      this.eventQueue = []
    } catch (error) {
      console.error('Failed to process event queue:', error)
    }
  }

  // Utility methods for common events
  async trackAppOpen() {
    await this.trackEvent('app_open')
  }

  async trackAppBackground() {
    await this.trackEvent('app_background')
  }

  async trackFeatureUsage(featureName: string, duration?: number) {
    await this.trackEvent('feature_usage', {
      feature_name: featureName,
      usage_duration: duration,
    })
  }

  async trackConversion(conversionType: string, value?: number) {
    await this.trackEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
    })
  }
}

export const AnalyticsService = new AnalyticsServiceClass()
