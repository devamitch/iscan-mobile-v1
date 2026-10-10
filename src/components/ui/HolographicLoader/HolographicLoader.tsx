'use client'

import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { useEffect } from 'react'
import { Dimensions, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import { CustomLottieView } from '@/components/ui/LottieView/LottieView'
import { useThemeStore } from '@/store/slices/themeSlice'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface HolographicLoaderProps {
  error?: string | null
  message?: string
}

export const HolographicLoader: React.FC<HolographicLoaderProps> = ({
  error,
  message = 'Initializing AEye Scan...',
}) => {
  const { colors, theme } = useThemeStore()
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    // Rotation animation
    rotation.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false)

    // Scale animation
    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true,
    )

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true,
    )

    // Fade in animation
    opacity.value = withTiming(1, { duration: 1000 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.2], [0.3, 0.1], Extrapolate.CLAMP),
  }))

  const particleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(rotation.value, [0, 360], [0, -20], Extrapolate.CLAMP)

    return {
      transform: [{ translateY }],
      opacity: interpolate(rotation.value, [0, 180, 360], [0.3, 1, 0.3], Extrapolate.CLAMP),
    }
  })

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.isDark ? '#000000' : '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={
          theme.isDark ? ['#000000', '#1a1a2e', '#16213e', '#0f3460'] : ['#ffffff', '#f0f4f8', '#e2e8f0', '#cbd5e0']
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Floating Particles */}
      {Array.from({ length: 20 }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            {
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.primary,
              left: Math.random() * SCREEN_WIDTH,
              top: Math.random() * SCREEN_HEIGHT,
            },
            particleStyle,
          ]}
        />
      ))}

      {/* Pulse Background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: colors.primary,
          },
          pulseStyle,
        ]}
      />

      {/* Main Loader Container */}
      <BlurView
        style={{
          width: 200,
          height: 200,
          borderRadius: 100,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}
        blurType={theme.isDark ? 'dark' : 'light'}
        blurAmount={20}
      >
        <Animated.View style={[animatedStyle]}>
          {/* Holographic Ring */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 2,
              borderColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Inner Ring */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 1,
                borderColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Center Dot */}
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              />
            </View>
          </View>
        </Animated.View>
      </BlurView>

      {/* Lottie Animation */}
      <CustomLottieView
        source={require('@/assets/lottie/holographic-loader.json')}
        style={{
          position: 'absolute',
          width: 150,
          height: 150,
        }}
        speed={1.5}
      />

      {/* Loading Text */}
      <Text
        style={{
          marginTop: 40,
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {error || message}
      </Text>

      {/* Progress Dots */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 20,
          gap: 8,
        }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              },
              {
                opacity: interpolate(rotation.value, [index * 120, (index + 1) * 120], [0.3, 1], Extrapolate.CLAMP),
              },
            ]}
          />
        ))}
      </View>
    </View>
  )
}
