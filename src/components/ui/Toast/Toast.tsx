'use client'

import type React from 'react'
import { useEffect } from 'react'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useTheme } from '../../../themes/ThemeProvider'
import type { ToastProps } from '../../../types/components'
import { hapticFeedback } from '../../../utils/haptics'

const { width: screenWidth } = Dimensions.get('window')

interface ToastManagerProps {
  toasts: (ToastProps & { id: string })[]
  onDismiss: (id: string) => void
}

export const Toast: React.FC<ToastProps & { id: string; onDismiss: (id: string) => void }> = ({
  id,
  message,
  type = 'info',
  duration = 3000,
  position = 'bottom',
  action,
  onDismiss,
}) => {
  const theme = useTheme()
  const translateY = useSharedValue(100)
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    // Show animation
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 })
    opacity.value = withTiming(1, { duration: 300 })
    scale.value = withSpring(1, { damping: 10, stiffness: 100 })

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [])

  const dismissToast = () => {
    translateY.value = withTiming(100, { duration: 300 })
    opacity.value = withTiming(0, { duration: 300 })
    scale.value = withTiming(0.8, { duration: 300 })

    setTimeout(() => {
      onDismiss(id)
    }, 300)
  }

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX
      opacity.value = interpolate(Math.abs(event.translationX), [0, screenWidth * 0.3], [1, 0.3])
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > screenWidth * 0.3 || Math.abs(event.velocityX) > 500) {
        translateX.value = withTiming(event.translationX > 0 ? screenWidth : -screenWidth, { duration: 200 })
        opacity.value = withTiming(0, { duration: 200 })
        runOnJS(hapticFeedback)('light')
        setTimeout(() => runOnJS(onDismiss)(id), 200)
      } else {
        translateX.value = withSpring(0)
        opacity.value = withTiming(1)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }))

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          icon: 'check-circle',
        }
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          icon: 'error',
        }
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          icon: 'warning',
        }
      case 'info':
      default:
        return {
          backgroundColor: theme.colors.info,
          icon: 'info',
        }
    }
  }

  const typeStyles = getTypeStyles()

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: typeStyles.backgroundColor,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    content: {
      flex: 1,
    },
    message: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.surface,
      marginBottom: action ? theme.spacing.xs : 0,
    },
    actionButton: {
      alignSelf: 'flex-start',
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.surface,
      textDecorationLine: 'underline',
    },
    closeButton: {
      marginLeft: theme.spacing.sm,
      padding: theme.spacing.xs,
    },
  })

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Icon name={typeStyles.icon} size={20} color={theme.colors.surface} style={styles.icon} />

        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                hapticFeedback('light')
                action.onPress()
              }}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            hapticFeedback('light')
            dismissToast()
          }}
        >
          <Icon name="close" size={18} color={theme.colors.surface} />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onDismiss }) => {
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
  })

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </View>
  )
}
