"use client"

import type React from "react"
import { useCallback } from "react"
import {
  ScrollView,
  type ScrollViewProps,
  RefreshControl,
  type ViewStyle,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native"
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated"

import { useTheme } from "@/themes/ThemeProvider"
import { HapticFeedback } from "@/utils/haptics"

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

interface AnimatedScrollViewProps extends Omit<ScrollViewProps, "onScroll"> {
  children: React.ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
  onRefresh?: () => Promise<void>
  refreshing?: boolean
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: () => void
  onScrollEndDrag?: () => void
  onMomentumScrollBegin?: () => void
  onMomentumScrollEnd?: () => void
  parallaxHeaderHeight?: number
  stickyHeaderHeight?: number
  fadeHeaderOnScroll?: boolean
  bounceEffect?: boolean
  hapticFeedback?: boolean
  snapToInterval?: number
  snapToAlignment?: "start" | "center" | "end"
}

export const EnhancedScrollView: React.FC<AnimatedScrollViewProps> = ({
  children,
  style,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  parallaxHeaderHeight = 0,
  stickyHeaderHeight = 0,
  fadeHeaderOnScroll = false,
  bounceEffect = true,
  hapticFeedback = true,
  snapToInterval,
  snapToAlignment = "start",
  ...scrollViewProps
}) => {
  const { colors } = useTheme()

  const scrollY = useSharedValue(0)
  const isScrolling = useSharedValue(false)
  const scrollVelocity = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
      scrollVelocity.value = event.velocity?.y || 0

      if (onScroll) {
        runOnJS(onScroll)(event as any)
      }
    },
    onBeginDrag: () => {
      isScrolling.value = true
      if (hapticFeedback) {
        runOnJS(HapticFeedback.impact)("light")
      }
      if (onScrollBeginDrag) {
        runOnJS(onScrollBeginDrag)()
      }
    },
    onEndDrag: () => {
      isScrolling.value = false
      if (onScrollEndDrag) {
        runOnJS(onScrollEndDrag)()
      }
    },
    onMomentumBegin: () => {
      if (onMomentumScrollBegin) {
        runOnJS(onMomentumScrollBegin)()
      }
    },
    onMomentumEnd: () => {
      if (onMomentumScrollEnd) {
        runOnJS(onMomentumScrollEnd)()
      }
    },
  })

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      if (hapticFeedback) {
        HapticFeedback.impact("medium")
      }
      await onRefresh()
    }
  }, [onRefresh, hapticFeedback])

  // Parallax header style
  const parallaxStyle = useAnimatedStyle(() => {
    if (parallaxHeaderHeight === 0) return {}

    const translateY = interpolate(
      scrollY.value,
      [0, parallaxHeaderHeight],
      [0, -parallaxHeaderHeight * 0.5],
      Extrapolate.CLAMP,
    )

    const scale = interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolate.CLAMP)

    return {
      transform: [{ translateY }, { scale }],
    }
  })

  // Fade header style
  const fadeHeaderStyle = useAnimatedStyle(() => {
    if (!fadeHeaderOnScroll || stickyHeaderHeight === 0) return {}

    const opacity = interpolate(scrollY.value, [0, stickyHeaderHeight], [1, 0], Extrapolate.CLAMP)

    return { opacity }
  })

  // Bounce effect style
  const bounceStyle = useAnimatedStyle(() => {
    if (!bounceEffect) return {}

    const bounceTranslateY = interpolate(scrollY.value, [-100, 0], [-50, 0], Extrapolate.CLAMP)

    return {
      transform: [{ translateY: bounceTranslateY }],
    }
  })

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={colors.surface}
    />
  ) : undefined

  return (
    <AnimatedScrollView
      style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        {
          flexGrow: 1,
        },
        contentContainerStyle,
      ]}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      bounces={bounceEffect}
      snapToInterval={snapToInterval}
      snapToAlignment={snapToAlignment}
      decelerationRate={snapToInterval ? "fast" : "normal"}
      {...scrollViewProps}
    >
      <Animated.View style={[parallaxStyle, fadeHeaderStyle, bounceStyle]}>{children}</Animated.View>
    </AnimatedScrollView>
  )
}
