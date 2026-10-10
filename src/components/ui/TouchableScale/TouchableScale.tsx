import type React from "react"
import type { ReactNode } from "react"
import type { ViewStyle } from "react-native"
import { TapGestureHandler, State } from "react-native-gesture-handler"
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated"
import { hapticFeedback } from "@/utils/haptics"

interface TouchableScaleProps {
  children: ReactNode
  onPress?: () => void
  onLongPress?: () => void
  disabled?: boolean
  activeScale?: number
  style?: ViewStyle
  hapticType?: "light" | "medium" | "heavy" | "selection"
}

export const TouchableScale: React.FC<TouchableScaleProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  activeScale = 0.95,
  style,
  hapticType = "light",
}) => {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (!disabled) {
        scale.value = withSpring(activeScale, { damping: 15, stiffness: 300 })
        opacity.value = withSpring(0.8, { damping: 15, stiffness: 300 })
        runOnJS(hapticFeedback)(hapticType)
      }
    },
    onEnd: (event) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      opacity.value = withSpring(1, { damping: 15, stiffness: 300 })

      if (!disabled && event.state === State.END) {
        if (onPress) {
          runOnJS(onPress)()
        }
      }
    },
    onFail: () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      opacity.value = withSpring(1, { damping: 15, stiffness: 300 })
    },
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <TapGestureHandler onGestureEvent={gestureHandler} onHandlerStateChange={gestureHandler} enabled={!disabled}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </TapGestureHandler>
  )
}
