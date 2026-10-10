import { useThemeStore } from '@/store/slices/themeSlice'
import { hapticFeedback } from '@/utils/haptics'
import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'
import { State, TapGestureHandler } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

interface FloatingActionButtonProps {
  onPress?: () => void
  icon: ReactNode
  disabled?: boolean
  size?: number
  style?: ViewStyle
  variant?: 'primary' | 'glass'
  gradient?: string[]
  hapticType?: 'light' | 'medium' | 'heavy'
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  disabled = false,
  size = 56,
  style,
  variant = 'primary',
  gradient,
  hapticType = 'medium',
}) => {
  const { colors, theme } = useThemeStore()
  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (!disabled) {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
        rotation.value = withTiming(15, { duration: 100 })
        runOnJS(hapticFeedback)(hapticType)
      }
    },
    onEnd: (event) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      rotation.value = withTiming(0, { duration: 200 })

      if (!disabled && event.state === State.END && onPress) {
        runOnJS(onPress)()
      }
    },
    onFail: () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      rotation.value = withTiming(0, { duration: 200 })
    },
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: disabled ? 0.5 : 1,
  }))

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scale.value, [0.9, 1], [0.3, 0.2], Extrapolate.CLAMP),
    elevation: interpolate(scale.value, [0.9, 1], [12, 8], Extrapolate.CLAMP),
  }))

  const buttonStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  }

  const renderContent = () => <Animated.View style={[buttonStyle, shadowStyle, style]}>{icon}</Animated.View>

  const ButtonWrapper = ({ children }: { children: ReactNode }) => (
    <TapGestureHandler onGestureEvent={gestureHandler} onHandlerStateChange={gestureHandler} enabled={!disabled}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </TapGestureHandler>
  )

  if (variant === 'glass') {
    return (
      <ButtonWrapper>
        <BlurView style={buttonStyle} blurType={theme.isDark ? 'dark' : 'light'} blurAmount={20}>
          {renderContent()}
        </BlurView>
      </ButtonWrapper>
    )
  }

  if (gradient) {
    return (
      <ButtonWrapper>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={buttonStyle}>
          {renderContent()}
        </LinearGradient>
      </ButtonWrapper>
    )
  }

  return (
    <ButtonWrapper>
      <Animated.View style={[buttonStyle, { backgroundColor: colors.primary }]}>{renderContent()}</Animated.View>
    </ButtonWrapper>
  )
}
