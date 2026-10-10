"use client"

import { useCallback } from "react"
import analytics from "@react-native-firebase/analytics"
import crashlytics from "@react-native-firebase/crashlytics"

import { useAuthStore } from "@/store/slices/authSlice"

export interface AnalyticsEvent {
  name: string
  parameters?: Record<string, any>
}

export const useAnalytics = () => {
  const { user } = useAuthStore()

  const trackEvent = useCallback(
    async (eventName: string, parameters?: Record<string, any>) => {
      if (__DEV__) {
        console.log("Analytics Event:", eventName, parameters)
        return
      }

      try {
        await analytics().logEvent(eventName, {
          ...parameters,
          user_id: user?.id,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error("Analytics tracking error:", error)
        crashlytics().recordError(error as Error)
      }
    },
    [user?.id],
  )

  const trackScreen = useCallback(async (screenName: string, screenClass?: string) => {
    if (__DEV__) {
      console.log("Analytics Screen:", screenName, screenClass)
      return
    }

    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      })
    } catch (error) {
      console.error("Screen tracking error:", error)
    }
  }, [])

  const setUserProperties = useCallback(async (properties: Record<string, any>) => {
    if (__DEV__) {
      console.log("Analytics User Properties:", properties)
      return
    }

    try {
      await Promise.all(
        Object.entries(properties).map(([key, value]) => analytics().setUserProperty(key, String(value))),
      )
    } catch (error) {
      console.error("User properties error:", error)
    }
  }, [])

  const trackPurchase = useCallback(
    async (
      value: number,
      currency: string,
      items?: Array<{
        item_id: string
        item_name: string
        category?: string
        quantity?: number
        price?: number
      }>,
    ) => {
      if (__DEV__) {
        console.log("Analytics Purchase:", { value, currency, items })
        return
      }

      try {
        await analytics().logPurchase({
          value,
          currency,
          items: items || [],
        })
      } catch (error) {
        console.error("Purchase tracking error:", error)
      }
    },
    [],
  )

  const trackLogin = useCallback(async (method: string) => {
    if (__DEV__) {
      console.log("Analytics Login:", method)
      return
    }

    try {
      await analytics().logLogin({ method })
    } catch (error) {
      console.error("Login tracking error:", error)
    }
  }, [])

  const trackSignUp = useCallback(async (method: string) => {
    if (__DEV__) {
      console.log("Analytics Sign Up:", method)
      return
    }

    try {
      await analytics().logSignUp({ method })
    } catch (error) {
      console.error("Sign up tracking error:", error)
    }
  }, [])

  const trackError = useCallback(async (error: Error, context?: Record<string, any>) => {
    console.error("Tracked Error:", error, context)

    if (!__DEV__) {
      try {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            crashlytics().setAttribute(key, String(value))
          })
        }

        crashlytics().recordError(error)
      } catch (crashError) {
        console.error("Error tracking failed:", crashError)
      }
    }
  }, [])

  const trackTiming = useCallback(
    async (name: string, value: number, category?: string, label?: string) => {
      if (__DEV__) {
        console.log("Analytics Timing:", { name, value, category, label })
        return
      }

      try {
        await trackEvent("timing_complete", {
          name,
          value,
          category,
          label,
        })
      } catch (error) {
        console.error("Timing tracking error:", error)
      }
    },
    [trackEvent],
  )

  return {
    trackEvent,
    trackScreen,
    setUserProperties,
    trackPurchase,
    trackLogin,
    trackSignUp,
    trackError,
    trackTiming,
  }
}
