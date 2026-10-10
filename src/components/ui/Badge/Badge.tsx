'use client'

import React from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated'
import { useTheme } from '../../../themes/ThemeProvider'
import type { BadgeProps } from '../../../types/components'

export const Badge: React.FC<BadgeProps> = ({ text, variant = 'primary', size = 'medium', animated = true, style }) => {
  const theme = useTheme()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  React.useEffect(() => {
    if (animated) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 100 }),
      )
    }
  }, [text, animated])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.surface,
        }
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          color: theme.colors.surface,
        }
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          color: theme.colors.surface,
        }
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          color: theme.colors.surface,
        }
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          color: theme.colors.surface,
        }
      case 'info':
        return {
          backgroundColor: theme.colors.info,
          color: theme.colors.surface,
        }
      default:
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.surface,
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
          minWidth: 16,
          height: 16,
        }
      case 'medium':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
          minWidth: 20,
          height: 20,
        }
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
          minWidth: 24,
          height: 24,
        }
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
          minWidth: 20,
          height: 20,
        }
    }
  }

  const variantStyles = getVariantStyles()
  const sizeStyles = getSizeStyles()

  const styles = StyleSheet.create({
    badge: {
      borderRadius: sizeStyles.height / 2,
      alignItems: 'center',
      justifyContent: 'center',
      ...sizeStyles,
      backgroundColor: variantStyles.backgroundColor,
    },
    text: {
      fontSize: sizeStyles.fontSize,
      fontWeight: '600',
      color: variantStyles.color,
      textAlign: 'center',
    },
  })

  return (
    <Animated.View style={[styles.badge, animatedStyle, style]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  )
}
