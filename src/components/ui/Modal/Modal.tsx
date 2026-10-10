'use client'

import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { useEffect } from 'react'
import { BackHandler, Dimensions, Modal as RNModal, TouchableOpacity, View, type ViewStyle } from 'react-native'
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
import { HapticFeedback } from '@/utils/haptics'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface ModalProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  animationType?: 'slide' | 'fade' | 'scale' | 'slideUp' | 'slideDown'
  position?: 'center' | 'bottom' | 'top' | 'fullscreen'
  backdropOpacity?: number
  backdropColor?: string
  closeOnBackdropPress?: boolean
  closeOnBackButton?: boolean
  style?: ViewStyle
  contentStyle?: ViewStyle
  hasBackdrop?: boolean
  blurBackdrop?: boolean
  gradientBackdrop?: boolean
  gradientColors?: string[]
  swipeToClose?: boolean
  swipeDirection?: 'down' | 'up' | 'left' | 'right'
  hapticFeedback?: boolean
  onShow?: () => void
  onHide?: () => void
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'slide',
  position = 'center',
  backdropOpacity = 0.5,
  backdropColor = '#000000',
  closeOnBackdropPress = true,
  closeOnBackButton = true,
  style,
  contentStyle,
  hasBackdrop = true,
  blurBackdrop = false,
  gradientBackdrop = false,
  gradientColors,
  swipeToClose = false,
  swipeDirection = 'down',
  hapticFeedback = true,
  onShow,
  onHide,
}) => {
  const { colors } = useTheme()

  // Animation values
  const backdropOpacityValue = useSharedValue(0)
  const contentOpacity = useSharedValue(0)
  const contentScale = useSharedValue(0.8)
  const contentTranslateY = useSharedValue(SCREEN_HEIGHT)
  const contentTranslateX = useSharedValue(0)

  // Gesture values
  const panY = useSharedValue(0)
  const panX = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      showModal()
      if (onShow) onShow()
    } else {
      hideModal()
      if (onHide) onHide()
    }
  }, [visible])

  useEffect(() => {
    if (closeOnBackButton) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (visible) {
          onClose()
          return true
        }
        return false
      })

      return () => backHandler.remove()
    }
  }, [visible, closeOnBackButton, onClose])

  const showModal = () => {
    backdropOpacityValue.value = withTiming(1, { duration: 300 })

    switch (animationType) {
      case 'fade':
        contentOpacity.value = withTiming(1, { duration: 300 })
        break
      case 'scale':
        contentScale.value = withSpring(1, { damping: 15 })
        contentOpacity.value = withTiming(1, { duration: 300 })
        break
      case 'slide':
      case 'slideUp':
        contentTranslateY.value = withSpring(0, { damping: 15 })
        break
      case 'slideDown':
        contentTranslateY.value = withSpring(0, { damping: 15 })
        break
    }

    if (hapticFeedback) {
      HapticFeedback.impact('light')
    }
  }

  const hideModal = () => {
    backdropOpacityValue.value = withTiming(0, { duration: 200 })

    switch (animationType) {
      case 'fade':
        contentOpacity.value = withTiming(0, { duration: 200 })
        break
      case 'scale':
        contentScale.value = withTiming(0.8, { duration: 200 })
        contentOpacity.value = withTiming(0, { duration: 200 })
        break
      case 'slide':
      case 'slideUp':
        contentTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 })
        break
      case 'slideDown':
        contentTranslateY.value = withTiming(-SCREEN_HEIGHT, { duration: 200 })
        break
    }
  }

  // Pan gesture for swipe to close
  const panGesture = Gesture.Pan()
    .enabled(swipeToClose)
    .onUpdate((event) => {
      if (swipeDirection === 'down' || swipeDirection === 'up') {
        panY.value = event.translationY

        if (swipeDirection === 'down' && panY.value > 0) {
          contentTranslateY.value = panY.value
          backdropOpacityValue.value = interpolate(panY.value, [0, SCREEN_HEIGHT * 0.3], [1, 0.3], 'clamp')
        } else if (swipeDirection === 'up' && panY.value < 0) {
          contentTranslateY.value = panY.value
          backdropOpacityValue.value = interpolate(Math.abs(panY.value), [0, SCREEN_HEIGHT * 0.3], [1, 0.3], 'clamp')
        }
      } else {
        panX.value = event.translationX

        if (swipeDirection === 'right' && panX.value > 0) {
          contentTranslateX.value = panX.value
        } else if (swipeDirection === 'left' && panX.value < 0) {
          contentTranslateX.value = panX.value
        }
      }
    })
    .onEnd((event) => {
      const threshold = SCREEN_HEIGHT * 0.2
      const velocityThreshold = 500

      if (swipeDirection === 'down' || swipeDirection === 'up') {
        const shouldClose = Math.abs(panY.value) > threshold || Math.abs(event.velocityY) > velocityThreshold

        if (shouldClose) {
          runOnJS(onClose)()
        } else {
          contentTranslateY.value = withSpring(0)
          backdropOpacityValue.value = withTiming(1)
        }

        panY.value = 0
      } else {
        const shouldClose = Math.abs(panX.value) > threshold || Math.abs(event.velocityX) > velocityThreshold

        if (shouldClose) {
          runOnJS(onClose)()
        } else {
          contentTranslateX.value = withSpring(0)
        }

        panX.value = 0
      }
    })

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacityValue.value,
  }))

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      opacity: animationType === 'fade' ? contentOpacity.value : 1,
      transform: [],
    }

    if (animationType === 'scale') {
      baseStyle.transform.push({ scale: contentScale.value })
    }

    if (animationType === 'slide' || animationType === 'slideUp' || animationType === 'slideDown') {
      baseStyle.transform.push({ translateY: contentTranslateY.value })
    }

    if (swipeToClose) {
      if (swipeDirection === 'down' || swipeDirection === 'up') {
        baseStyle.transform.push({ translateY: contentTranslateY.value })
      } else {
        baseStyle.transform.push({ translateX: contentTranslateX.value })
      }
    }

    return baseStyle
  })

  // Position styles
  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'top':
        return {
          justifyContent: 'flex-start',
          paddingTop: 50,
        }
      case 'bottom':
        return {
          justifyContent: 'flex-end',
          paddingBottom: 50,
        }
      case 'fullscreen':
        return {
          justifyContent: 'center',
          margin: 0,
        }
      default:
        return {
          justifyContent: 'center',
        }
    }
  }

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      if (hapticFeedback) {
        HapticFeedback.impact('light')
      }
      onClose()
    }
  }

  const renderBackdrop = () => {
    if (!hasBackdrop) return null

    if (blurBackdrop) {
      return (
        <Animated.View style={[{ flex: 1 }, backdropStyle]}>
          <BlurView
            style={{ flex: 1 }}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor={backdropColor}
          />
        </Animated.View>
      )
    }

    if (gradientBackdrop && gradientColors) {
      return (
        <Animated.View style={[{ flex: 1 }, backdropStyle]}>
          <LinearGradient colors={gradientColors} style={{ flex: 1 }} />
        </Animated.View>
      )
    }

    return (
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: backdropColor,
          },
          backdropStyle,
        ]}
      />
    )
  }

  return (
    <RNModal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={[{ flex: 1 }, getPositionStyle(), style]}>
        {/* Backdrop */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          {renderBackdrop()}
        </TouchableOpacity>

        {/* Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: position === 'fullscreen' ? 0 : 16,
                margin: position === 'fullscreen' ? 0 : 20,
                maxHeight: position === 'fullscreen' ? '100%' : '80%',
              },
              contentStyle,
              contentAnimatedStyle,
            ]}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </RNModal>
  )
}
