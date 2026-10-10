'use client'

import React from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../../../themes/ThemeProvider'
import type { SkeletonProps } from '../../../types/components'

export const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius, animated = true, style }) => {
  const theme = useTheme()
  const shimmerValue = useSharedValue(0)

  React.useEffect(() => {
    if (animated) {
      shimmerValue.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false)
    }
  }, [animated])

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.7, 0.3])

    return {
      opacity: animated ? opacity : 0.3,
    }
  })

  const styles = StyleSheet.create({
    skeleton: {
      backgroundColor: theme.colors.border,
      width: typeof width === 'number' ? width : width,
      height: typeof height === 'number' ? height : height,
      borderRadius: borderRadius || theme.borderRadius.small,
    },
  })

  return <Animated.View style={[styles.skeleton, animatedStyle, style]} />
}

// Predefined skeleton components
export const SkeletonText: React.FC<{ lines?: number; width?: string | number }> = ({ lines = 1, width = '100%' }) => {
  const theme = useTheme()

  return (
    <>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : width}
          height={16}
          style={{ marginBottom: index < lines - 1 ? theme.spacing.xs : 0 }}
        />
      ))}
    </>
  )
}

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} />
)

export const SkeletonCard: React.FC = () => {
  const theme = useTheme()

  return (
    <Animated.View
      style={{
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.medium,
        marginBottom: theme.spacing.sm,
      }}
    >
      <Skeleton width="100%" height={120} style={{ marginBottom: theme.spacing.sm }} />
      <SkeletonText lines={2} />
      <Skeleton width="40%" height={12} style={{ marginTop: theme.spacing.xs }} />
    </Animated.View>
  )
}
