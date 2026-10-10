"use client"

import React from "react"
import { type ViewStyle, StatusBar, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from "react-native-reanimated"

import { useTheme } from "@/themes/ThemeProvider"

interface SafeAreaProps {
  children: React.ReactNode
  style?: ViewStyle
  edges?: ("top" | "bottom" | "left" | "right")[]
  backgroundColor?: string
  statusBarStyle?: "light-content" | "dark-content" | "default"
  animated?: boolean
  gradientBackground?: boolean
  gradientColors?: string[]
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  style,
  edges = ["top", "bottom"],
  backgroundColor,
  statusBarStyle,
  animated = false,
  gradientBackground = false,
  gradientColors,
}) => {
  const { colors, isDark } = useTheme()

  const animationValue = useSharedValue(0)

  React.useEffect(() => {
    if (animated) {
      animationValue.value = withTiming(1, { duration: 300 })
    }
  }, [animated])

  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {}

    return {
      backgroundColor: interpolateColor(
        animationValue.value,
        [0, 1],
        ["transparent", backgroundColor || colors.background],
      ),
    }
  })

  const defaultStatusBarStyle = isDark ? "light-content" : "dark-content"
  const finalBackgroundColor = backgroundColor || colors.background

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle || defaultStatusBarStyle}
        backgroundColor={Platform.OS === "android" ? finalBackgroundColor : "transparent"}
        translucent={Platform.OS === "android"}
      />
      <SafeAreaView
        edges={edges}
        style={[
          {
            flex: 1,
            backgroundColor: finalBackgroundColor,
          },
          style,
          animated && animatedStyle,
        ]}
      >
        {children}
      </SafeAreaView>
    </>
  )
}
