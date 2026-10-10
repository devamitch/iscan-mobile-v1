import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { Text, type TextStyle, type ViewStyle } from 'react-native'
import { State, TapGestureHandler } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { CustomLottieView } from '@/components/ui/LottieView/LottieView'
import { useThemeStore } from '@/store/slices/themeSlice'
import { hapticFeedback } from '@/utils/haptics'

interface AnimatedButtonProps {
  title?: string
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'gradient'
  size?: 'small' | 'medium' | 'large'
  icon?: React.ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection'
  gradient?: string[]
  lottieSource?: any
  animationType?: 'scale' | 'bounce' | 'pulse' | 'ripple'
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle,
  hapticType = 'medium',
  gradient,
  lottieSource,
  animationType = 'scale',
}) => {
  const { colors, theme } = useThemeStore()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const progress = useSharedValue(0)
  const rippleScale = useSharedValue(0)

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (!disabled && !loading) {
        switch (animationType) {
          case 'scale':
            scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
            break
          case 'bounce':
            scale.value = withSpring(0.9, { damping: 10, stiffness: 200 })
            break
          case 'pulse':
            opacity.value = withTiming(0.7, { duration: 100 })
            break
          case 'ripple':
            rippleScale.value = withTiming(1, { duration: 300 })
            break
        }
        progress.value = withTiming(1, { duration: 150 })
        runOnJS(hapticFeedback)(hapticType)
      }
    },
    onEnd: (event) => {
      switch (animationType) {
        case 'scale':
          scale.value = withSpring(1, { damping: 15, stiffness: 300 })
          break
        case 'bounce':
          scale.value = withSpring(1.05, { damping: 10, stiffness: 200 }, () => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 })
          })
          break
        case 'pulse':
          opacity.value = withTiming(1, { duration: 100 })
          break
        case 'ripple':
          rippleScale.value = withTiming(0, { duration: 200 })
          break
      }
      progress.value = withTiming(0, { duration: 150 })

      if (!disabled && !loading && event.state === State.END && onPress) {
        runOnJS(onPress)()
      }
    },
    onFail: () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      opacity.value = withTiming(1, { duration: 100 })
      progress.value = withTiming(0, { duration: 150 })
      rippleScale.value = withTiming(0, { duration: 200 })
    },
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }))

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.primary, colors.primaryDark]),
  }))

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: 1 - rippleScale.value,
  }))

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          minHeight: 36,
        }
      case 'large':
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 20,
          minHeight: 56,
        }
      default:
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 16,
          minHeight: 48,
        }
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14
      case 'large':
        return 18
      default:
        return 16
    }
  }

  const renderContent = () => (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          position: 'relative',
          overflow: 'hidden',
        },
        getSizeStyles(),
        variant === 'glass' && {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        variant === 'ghost' && {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        },
        variant === 'secondary' && {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        variant === 'primary' && !gradient && backgroundStyle,
        style,
      ]}
    >
      {/* Ripple Effect */}
      {animationType === 'ripple' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: colors.white + '30',
              borderRadius: getSizeStyles().borderRadius,
            },
            rippleStyle,
          ]}
        />
      )}

      {/* Loading Animation */}
      {loading && lottieSource && (
        <CustomLottieView
          source={lottieSource}
          style={{
            width: getTextSize() + 4,
            height: getTextSize() + 4,
          }}
        />
      )}

      {/* Icon */}
      {!loading && icon}

      {/* Title */}
      {title && (
        <Text
          style={[
            {
              fontSize: getTextSize(),
              fontWeight: '600',
              color: variant === 'primary' ? colors.white : colors.text,
            },
            variant === 'ghost' && { color: colors.primary },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Animated.View>
  )

  const ButtonWrapper = ({ children }: { children: React.ReactNode }) => (
    <TapGestureHandler
      onGestureEvent={gestureHandler}
      onHandlerStateChange={gestureHandler}
      enabled={!disabled && !loading}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </TapGestureHandler>
  )

  if (variant === 'glass') {
    return (
      <ButtonWrapper>
        <BlurView style={[getSizeStyles(), style]} blurType={theme.isDark ? 'dark' : 'light'} blurAmount={20}>
          {renderContent()}
        </BlurView>
      </ButtonWrapper>
    )
  }

  if ((variant === 'primary' || variant === 'gradient') && gradient) {
    return (
      <ButtonWrapper>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[getSizeStyles(), style]}>
          {renderContent()}
        </LinearGradient>
      </ButtonWrapper>
    )
  }

  return <ButtonWrapper>{renderContent()}</ButtonWrapper>
}
