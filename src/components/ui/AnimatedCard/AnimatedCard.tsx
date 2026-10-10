'use client'

import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { useEffect } from 'react'
import { type ViewStyle, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/themes/ThemeProvider'
import type { AnimatedCardProps } from '@/types'
import { HapticFeedback } from '@/utils/haptics'

interface ExtendedAnimatedCardProps extends AnimatedCardProps {
  children: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
  onLongPress?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  disabled?: boolean
  elevation?: number
  borderRadius?: number
  glassEffect?: boolean
  gradientColors?: string[]
  animationType?: 'scale' | 'fade' | 'slide' | 'bounce'
  hapticFeedback?: boolean
}

export const AnimatedCard: React.FC<ExtendedAnimatedCardProps> = ({
  children,
  style,
  onPress,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  elevation = 4,
  borderRadius = 16,
  glassEffect = true,
  gradientColors,
  animationType = 'scale',
  hapticFeedback = true,
}) => {
  const { colors, shadows } = useTheme()

  // Animation values
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const rotation = useSharedValue(0)

  // Gesture values
  const panX = useSharedValue(0)
  const panY = useSharedValue(0)
  const isPressed = useSharedValue(false)

  useEffect(() => {
    // Initial animation based on type
    switch (animationType) {
      case 'fade':
        opacity.value = 0
        opacity.value = withTiming(1, { duration: 500 })
        break
      case 'slide':
        translateY.value = 50
        translateY.value = withSpring(0, { damping: 15 })
        break
      case 'bounce':
        scale.value = 0
        scale.value = withSpring(1, { damping: 10, stiffness: 100 })
        break
      default:
        scale.value = 0.9
        scale.value = withSpring(1, { damping: 15 })
    }
  }, [animationType])

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      if (disabled) return
      isPressed.value = true
      scale.value = withSpring(0.95, { damping: 15 })
      if (hapticFeedback) {
        runOnJS(HapticFeedback.impact)('light')
      }
    })
    .onFinalize(() => {
      if (disabled) return
      isPressed.value = false
      scale.value = withSpring(1, { damping: 15 })
      if (onPress) {
        runOnJS(onPress)()
      }
    })

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (disabled || !onLongPress) return
      if (hapticFeedback) {
        runOnJS(HapticFeedback.impact)('medium')
      }
      runOnJS(onLongPress)()
    })

  // Pan gesture for swipe detection
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (disabled) return
      panX.value = event.translationX
      panY.value = event.translationY

      // Subtle rotation based on pan
      rotation.value = interpolate(event.translationX, [-100, 0, 100], [-5, 0, 5])
    })
    .onEnd((event) => {
      if (disabled) return

      const swipeThreshold = 100
      const velocityThreshold = 500

      // Check for swipe gestures
      if (Math.abs(event.translationX) > swipeThreshold || Math.abs(event.velocityX) > velocityThreshold) {
        if (event.translationX > 0 && onSwipeRight) {
          if (hapticFeedback) {
            runOnJS(HapticFeedback.impact)('medium')
          }
          runOnJS(onSwipeRight)()
        } else if (event.translationX < 0 && onSwipeLeft) {
          if (hapticFeedback) {
            runOnJS(HapticFeedback.impact)('medium')
          }
          runOnJS(onSwipeLeft)()
        }
      }

      // Reset values
      panX.value = withSpring(0)
      panY.value = withSpring(0)
      rotation.value = withSpring(0)
    })

  // Combined gesture
  const combinedGesture = Gesture.Simultaneous(tapGesture, longPressGesture, panGesture)

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value + panX.value * 0.1 },
      { translateY: translateY.value + panY.value * 0.1 },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }))

  const cardStyle = [
    styles.card,
    {
      borderRadius,
      ...shadows[elevation === 2 ? 'small' : elevation === 8 ? 'large' : 'medium'],
    },
    style,
  ]

  const CardContent = () => (
    <Animated.View style={[cardStyle, animatedStyle]}>
      {glassEffect ? (
        <BlurView
          style={styles.blurContainer}
          blurType="light"
          blurAmount={10}
          reducedTransparencyFallbackColor={colors.surface}
        >
          {gradientColors ? (
            <LinearGradient colors={gradientColors} style={styles.gradientContainer}>
              {children}
            </LinearGradient>
          ) : (
            <>{children}</>
          )}
        </BlurView>
      ) : gradientColors ? (
        <LinearGradient colors={gradientColors} style={[styles.gradientContainer, { borderRadius }]}>
          {children}
        </LinearGradient>
      ) : (
        <>{children}</>
      )}
    </Animated.View>
  )

  if (disabled || (!onPress && !onLongPress && !onSwipeLeft && !onSwipeRight)) {
    return <CardContent />
  }

  return (
    <GestureDetector gesture={combinedGesture}>
      <CardContent />
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
})
