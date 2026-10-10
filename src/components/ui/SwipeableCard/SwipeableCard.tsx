'use client'

import type React from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import { PanGestureHandler, type PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useTheme } from '../../../themes/ThemeProvider'
import { hapticFeedback } from '../../../utils/haptics'

const { width: screenWidth } = Dimensions.get('window')
const SWIPE_THRESHOLD = screenWidth * 0.3

interface SwipeAction {
  icon: string
  color: string
  backgroundColor: string
  onPress: () => void
}

interface SwipeableCardProps {
  children: React.ReactNode
  leftAction?: SwipeAction
  rightAction?: SwipeAction
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  style?: any
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftAction,
  rightAction,
  onSwipeLeft,
  onSwipeRight,
  style,
}) => {
  const theme = useTheme()
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      runOnJS(hapticFeedback)('light')
    },
    onActive: (event) => {
      translateX.value = event.translationX
    },
    onEnd: (event) => {
      const shouldSwipeLeft = event.translationX > SWIPE_THRESHOLD && leftAction
      const shouldSwipeRight = event.translationX < -SWIPE_THRESHOLD && rightAction

      if (shouldSwipeLeft) {
        translateX.value = withTiming(screenWidth, { duration: 300 })
        opacity.value = withTiming(0, { duration: 300 })
        runOnJS(hapticFeedback)('medium')
        runOnJS(() => {
          setTimeout(() => {
            leftAction?.onPress()
            onSwipeLeft?.()
          }, 300)
        })()
      } else if (shouldSwipeRight) {
        translateX.value = withTiming(-screenWidth, { duration: 300 })
        opacity.value = withTiming(0, { duration: 300 })
        runOnJS(hapticFeedback)('medium')
        runOnJS(() => {
          setTimeout(() => {
            rightAction?.onPress()
            onSwipeRight?.()
          }, 300)
        })()
      } else {
        translateX.value = withSpring(0)
      }
    },
  })

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }))

  const leftActionAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp')

    return {
      transform: [{ scale }],
      opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    }
  })

  const rightActionAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp')

    return {
      transform: [{ scale }],
      opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
    }
  })

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor =
      translateX.value > 0
        ? leftAction?.backgroundColor || theme.colors.success
        : rightAction?.backgroundColor || theme.colors.error

    return {
      backgroundColor: interpolateColor(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [theme.colors.surface, backgroundColor],
      ),
    }
  })

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    background: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
    },
    actionContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
    },
  })

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.background, backgroundAnimatedStyle]}>
        {leftAction && (
          <Animated.View style={[styles.actionContainer, leftActionAnimatedStyle]}>
            <Icon name={leftAction.icon} size={24} color={leftAction.color} />
          </Animated.View>
        )}

        {rightAction && (
          <Animated.View style={[styles.actionContainer, rightActionAnimatedStyle]}>
            <Icon name={rightAction.icon} size={24} color={rightAction.color} />
          </Animated.View>
        )}
      </Animated.View>

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>{children}</Animated.View>
      </PanGestureHandler>
    </View>
  )
}
