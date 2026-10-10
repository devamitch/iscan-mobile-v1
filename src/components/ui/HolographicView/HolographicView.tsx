'use client'

import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { useEffect } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/themes/ThemeProvider'

interface HolographicViewProps {
  children: React.ReactNode
  style?: ViewStyle
  animated?: boolean
  intensity?: number
}

export const HolographicView: React.FC<HolographicViewProps> = ({
  children,
  style,
  animated = true,
  intensity = 1,
}) => {
  const { colors } = useTheme()
  const animationValue = useSharedValue(0)

  useEffect(() => {
    if (animated) {
      animationValue.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true)
    }
  }, [animated])

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animationValue.value, [0, 1], [0.3, 0.8])
    const scale = interpolate(animationValue.value, [0, 1], [1, 1.02])

    return {
      opacity: opacity * intensity,
      transform: [{ scale }],
    }
  })

  return (
    <View style={[styles.container, style]}>
      {/* Base layer */}
      <View style={styles.baseLayer}>
        <LinearGradient
          colors={[colors.primary + '20', colors.secondary + '30', colors.accent + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={15} />
      </View>

      {/* Animated holographic layer */}
      {animated && (
        <Animated.View style={[styles.holographicLayer, animatedStyle]}>
          <LinearGradient
            colors={[colors.primary + '40', colors.secondary + '60', colors.accent + '40', colors.primary + '40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Border glow */}
      <View style={styles.borderGlow}>
        <LinearGradient
          colors={[colors.primary + '60', 'transparent', colors.secondary + '60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topBorder}
        />
        <LinearGradient
          colors={[colors.secondary + '60', 'transparent', colors.accent + '60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.rightBorder}
        />
        <LinearGradient
          colors={[colors.accent + '60', 'transparent', colors.primary + '60']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomBorder}
        />
        <LinearGradient
          colors={[colors.primary + '60', 'transparent', colors.secondary + '60']}
          start={{ x: 1, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftBorder}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  baseLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  holographicLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    zIndex: 10,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  rightBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 2,
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  leftBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 2,
  },
})
