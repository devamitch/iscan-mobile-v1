"use client"

import React, { useRef, useImperativeHandle, forwardRef } from "react"
import type { ViewStyle } from "react-native"
import LottieView, { type AnimationObject, type LottieViewProps } from "lottie-react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
} from "react-native-reanimated"

interface EnhancedLottieViewProps extends Omit<LottieViewProps, "style"> {
  source: AnimationObject | string | { uri: string }
  style?: ViewStyle
  autoPlay?: boolean
  loop?: boolean
  speed?: number
  progress?: number
  onAnimationFinish?: () => void
  onAnimationStart?: () => void
  animateOnMount?: boolean
  mountAnimation?: "fade" | "scale" | "slide" | "bounce"
  delay?: number
}

export interface LottieViewRef {
  play: () => void
  pause: () => void
  reset: () => void
  resume: () => void
}

export const EnhancedLottieView = forwardRef<LottieViewRef, EnhancedLottieViewProps>(
  (
    {
      source,
      style,
      autoPlay = true,
      loop = true,
      speed = 1,
      progress,
      onAnimationFinish,
      onAnimationStart,
      animateOnMount = false,
      mountAnimation = "fade",
      delay = 0,
      ...lottieProps
    },
    ref,
  ) => {
    const lottieRef = useRef<LottieView>(null)

    // Animation values for mount animations
    const opacity = useSharedValue(animateOnMount ? 0 : 1)
    const scale = useSharedValue(animateOnMount ? 0.8 : 1)
    const translateY = useSharedValue(animateOnMount ? 20 : 0)

    useImperativeHandle(ref, () => ({
      play: () => lottieRef.current?.play(),
      pause: () => lottieRef.current?.pause(),
      reset: () => lottieRef.current?.reset(),
      resume: () => lottieRef.current?.resume(),
    }))

    React.useEffect(() => {
      if (animateOnMount) {
        const animateIn = () => {
          switch (mountAnimation) {
            case "fade":
              opacity.value = withTiming(1, { duration: 500 })
              break
            case "scale":
              scale.value = withSpring(1, { damping: 15 })
              break
            case "slide":
              translateY.value = withSpring(0, { damping: 15 })
              break
            case "bounce":
              scale.value = withSequence(withTiming(1.1, { duration: 200 }), withSpring(1, { damping: 10 }))
              break
          }
        }

        if (delay > 0) {
          setTimeout(animateIn, delay)
        } else {
          animateIn()
        }
      }
    }, [animateOnMount, mountAnimation, delay])

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }))

    const handleAnimationFinish = () => {
      if (onAnimationFinish) {
        onAnimationFinish()
      }
    }

    const handleAnimationStart = () => {
      if (onAnimationStart) {
        onAnimationStart()
      }
    }

    return (
      <Animated.View style={[style, animatedStyle]}>
        <LottieView
          ref={lottieRef}
          source={source}
          autoPlay={autoPlay}
          loop={loop}
          speed={speed}
          progress={progress}
          onAnimationFinish={handleAnimationFinish}
          style={{ flex: 1 }}
          {...lottieProps}
        />
      </Animated.View>
    )
  },
)

EnhancedLottieView.displayName = "EnhancedLottieView"

// Export as LottieView for convenience
export { EnhancedLottieView as LottieView }
