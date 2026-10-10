"use client"

import type React from "react"
import { TouchableOpacity, Text, type ViewStyle, type TextStyle, ActivityIndicator, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from "react-native-reanimated"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import LinearGradient from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/Ionicons"

import { useTheme } from "@/themes/ThemeProvider"
import { HapticFeedback } from "@/utils/haptics"

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient"
  size?: "small" | "medium" | "large"
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconPosition?: "left" | "right"
  style?: ViewStyle
  textStyle?: TextStyle
  hapticFeedback?: boolean
  animationType?: "scale" | "bounce" | "pulse"
  gradientColors?: string[]
  borderRadius?: number
  elevation?: number
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  hapticFeedback = true,
  animationType = "scale",
  gradientColors,
  borderRadius,
  elevation = 2,
}) => {
  const { colors, typography, shadows } = useTheme()

  // Animation values
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const rotation = useSharedValue(0)

  // Gesture handling
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      if (disabled || loading) return

      switch (animationType) {
        case "scale":
          scale.value = withSpring(0.95, { damping: 15 })
          break
        case "bounce":
          scale.value = withSpring(0.9, { damping: 10 })
          break
        case "pulse":
          opacity.value = withTiming(0.7, { duration: 100 })
          break
      }

      if (hapticFeedback) {
        runOnJS(HapticFeedback.impact)("light")
      }
    })
    .onFinalize(() => {
      if (disabled || loading) return

      switch (animationType) {
        case "scale":
        case "bounce":
          scale.value = withSpring(1, { damping: 15 })
          break
        case "pulse":
          opacity.value = withTiming(1, { duration: 100 })
          break
      }

      runOnJS(onPress)()
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }))

  // Style configurations
  const sizeConfig = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      fontSize: 16,
      iconSize: 20,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      fontSize: 18,
      iconSize: 24,
    },
  }

  const variantConfig = {
    primary: {
      backgroundColor: colors.primary,
      textColor: "white",
      borderColor: colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.secondary,
      textColor: "white",
      borderColor: colors.secondary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: "transparent",
      textColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: "transparent",
      textColor: colors.primary,
      borderColor: "transparent",
      borderWidth: 0,
    },
    gradient: {
      backgroundColor: "transparent",
      textColor: "white",
      borderColor: "transparent",
      borderWidth: 0,
    },
  }

  const currentSize = sizeConfig[size]
  const currentVariant = variantConfig[variant]

  const buttonStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: currentSize.paddingVertical,
    paddingHorizontal: currentSize.paddingHorizontal,
    backgroundColor: disabled ? colors.textDisabled : currentVariant.backgroundColor,
    borderColor: disabled ? colors.textDisabled : currentVariant.borderColor,
    borderWidth: currentVariant.borderWidth,
    borderRadius: borderRadius || 8,
    opacity: disabled ? 0.6 : 1,
    ...shadows[elevation === 0 ? "small" : elevation > 4 ? "large" : "medium"],
  }

  const buttonTextStyle: TextStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: typography.button.fontWeight,
    color: disabled ? colors.background : currentVariant.textColor,
    marginLeft: icon && iconPosition === "left" ? 8 : 0,
    marginRight: icon && iconPosition === "right" ? 8 : 0,
  }

  const renderIcon = () => {
    if (!icon) return null

    return (
      <Icon name={icon} size={currentSize.iconSize} color={disabled ? colors.background : currentVariant.textColor} />
    )
  }

  const renderContent = () => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {loading ? (
        <ActivityIndicator size="small" color={currentVariant.textColor} style={{ marginRight: 8 }} />
      ) : (
        icon && iconPosition === "left" && renderIcon()
      )}

      <Text style={[buttonTextStyle, textStyle]}>{loading ? "Loading..." : title}</Text>

      {!loading && icon && iconPosition === "right" && renderIcon()}
    </View>
  )

  const ButtonComponent = () => (
    <AnimatedTouchableOpacity
      style={[buttonStyle, style, animatedStyle]}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </AnimatedTouchableOpacity>
  )

  if (variant === "gradient") {
    const finalGradientColors = gradientColors || [colors.primary, colors.secondary]

    return (
      <GestureDetector gesture={tapGesture}>
        <Animated.View style={[buttonStyle, style, animatedStyle]}>
          <LinearGradient
            colors={finalGradientColors}
            style={{
              ...buttonStyle,
              margin: 0,
              borderRadius: borderRadius || 8,
            }}
          >
            {renderContent()}
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    )
  }

  return (
    <GestureDetector gesture={tapGesture}>
      <ButtonComponent />
    </GestureDetector>
  )
}
