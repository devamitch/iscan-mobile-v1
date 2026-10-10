'use client'

import type React from 'react'
import { useCallback, useState } from 'react'
import { Dimensions, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'

import { AnimatedCard } from '@/components/ui/AnimatedCard/AnimatedCard'
import { EnhancedScrollView } from '@/components/ui/AnimatedScrollView/AnimatedScrollView'
import { Button } from '@/components/ui/Button/Button'
import { LottieView } from '@/components/ui/LottieView/LottieView'
import { SafeArea } from '@/components/ui/SafeArea/SafeArea'
import { useAuthStore } from '@/store/slices/authSlice'
import { useTheme } from '@/themes/ThemeProvider'
import { HapticFeedback } from '@/utils/haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const HEADER_HEIGHT = 200

interface QuickAction {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  gradient: string[]
  onPress: () => void
}

interface RecentScan {
  id: string
  type: string
  timestamp: string
  accuracy: string
  status: 'success' | 'warning' | 'error'
}

export const HomeScreen: React.FC = () => {
  const { colors, spacing } = useTheme()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()

  const [refreshing, setRefreshing] = useState(false)
  const scrollY = useSharedValue(0)

  const quickActions: QuickAction[] = [
    {
      id: 'face-scan',
      title: 'Face Scan',
      subtitle: 'Quick facial recognition',
      icon: 'happy-outline',
      color: colors.primary,
      gradient: [colors.primary, colors.primaryLight],
      onPress: () => {
        HapticFeedback.impact('medium')
        // Navigate to face scan
      },
    },
    {
      id: 'iris-scan',
      title: 'Iris Scan',
      subtitle: 'High-precision scanning',
      icon: 'eye-outline',
      color: colors.secondary,
      gradient: [colors.secondary, colors.secondaryLight],
      onPress: () => {
        HapticFeedback.impact('medium')
        // Navigate to iris scan
      },
    },
    {
      id: 'hand-tracking',
      title: 'Hand Tracking',
      subtitle: 'Gesture recognition',
      icon: 'hand-left-outline',
      color: colors.accent,
      gradient: [colors.accent, '#60a5fa'],
      onPress: () => {
        HapticFeedback.impact('medium')
        // Navigate to hand tracking
      },
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'View your insights',
      icon: 'analytics-outline',
      color: colors.success,
      gradient: [colors.success, '#34d399'],
      onPress: () => {
        HapticFeedback.impact('medium')
        // Navigate to analytics
      },
    },
  ]

  const recentScans: RecentScan[] = [
    {
      id: '1',
      type: 'Face Recognition',
      timestamp: '2 hours ago',
      accuracy: '98.5%',
      status: 'success',
    },
    {
      id: '2',
      type: 'Iris Scan',
      timestamp: '5 hours ago',
      accuracy: '99.2%',
      status: 'success',
    },
    {
      id: '3',
      type: 'Hand Tracking',
      timestamp: '1 day ago',
      accuracy: '97.8%',
      status: 'success',
    },
    {
      id: '4',
      type: 'Pose Analysis',
      timestamp: '2 days ago',
      accuracy: '89.3%',
      status: 'warning',
    },
  ]

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    HapticFeedback.impact('light')

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setRefreshing(false)
  }, [])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, HEADER_HEIGHT * 0.5], [1, 0], Extrapolate.CLAMP)

    const translateY = interpolate(scrollY.value, [0, HEADER_HEIGHT], [0, -HEADER_HEIGHT * 0.3], Extrapolate.CLAMP)

    return {
      opacity,
      transform: [{ translateY }],
    }
  })

  const getStatusColor = (status: RecentScan['status']) => {
    switch (status) {
      case 'success':
        return colors.success
      case 'warning':
        return colors.warning
      case 'error':
        return colors.error
      default:
        return colors.textSecondary
    }
  }

  return (
    <SafeArea style={{ backgroundColor: colors.background }} statusBarStyle="light-content">
      {/* Header Background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: HEADER_HEIGHT + insets.top,
            zIndex: -1,
          },
          headerAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary, colors.accent]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <EnhancedScrollView
        onScroll={scrollHandler}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={{
          paddingBottom: spacing.xxl,
        }}
        bounceEffect
        hapticFeedback
      >
        {/* Header Content */}
        <Animated.View
          style={[
            {
              height: HEADER_HEIGHT,
              justifyContent: 'center',
              paddingHorizontal: spacing.lg,
            },
            headerAnimatedStyle,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: spacing.xs,
                }}
              >
                Welcome back,
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                {user?.name || 'User'}
              </Text>
            </View>

            <AnimatedCard
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                HapticFeedback.impact('light')
                // Navigate to profile
              }}
            >
              <Icon name="person-outline" size={28} color="white" />
            </AnimatedCard>
          </View>

          {/* Stats Row */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: spacing.lg,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>127</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>Total Scans</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>98.2%</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>Avg Accuracy</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>2.1s</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>Avg Speed</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            Quick Actions
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.md,
            }}
          >
            {quickActions.map((action, index) => (
              <AnimatedCard
                key={action.id}
                style={{
                  width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
                  padding: spacing.lg,
                }}
                onPress={action.onPress}
                gradientColors={action.gradient}
                animationType="bounce"
              >
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.md,
                    }}
                  >
                    <Icon name={action.icon} size={24} color="white" />
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: 'white',
                      textAlign: 'center',
                      marginBottom: spacing.xs,
                    }}
                  >
                    {action.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'center',
                    }}
                  >
                    {action.subtitle}
                  </Text>
                </View>
              </AnimatedCard>
            ))}
          </View>
        </View>

        {/* Recent Scans */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: colors.text,
              }}
            >
              Recent Scans
            </Text>
            <Button
              title="View All"
              variant="ghost"
              size="small"
              onPress={() => {
                HapticFeedback.impact('light')
                // Navigate to scan history
              }}
            />
          </View>

          {recentScans.map((scan, index) => (
            <AnimatedCard
              key={scan.id}
              style={{
                padding: spacing.lg,
                marginBottom: spacing.md,
                backgroundColor: colors.surface,
              }}
              onPress={() => {
                HapticFeedback.impact('light')
                // Navigate to scan details
              }}
              animationType="slide"
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.text,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {scan.type}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {scan.timestamp}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: getStatusColor(scan.status),
                      marginBottom: spacing.xs,
                    }}
                  >
                    {scan.accuracy}
                  </Text>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: getStatusColor(scan.status),
                    }}
                  />
                </View>
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* AI Assistant Card */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <AnimatedCard
            style={{
              padding: spacing.xl,
              backgroundColor: colors.surface,
            }}
            gradientColors={[colors.primary + '20', colors.secondary + '20']}
            onPress={() => {
              HapticFeedback.impact('medium')
              // Navigate to AI assistant
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: colors.text,
                    marginBottom: spacing.sm,
                  }}
                >
                  AI Assistant
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 20,
                  }}
                >
                  Get personalized insights and recommendations based on your biometric data
                </Text>
              </View>
              <LottieView
                source={require('@/assets/json/ai-assistant.json')}
                style={{ width: 80, height: 80 }}
                autoPlay
                loop
              />
            </View>
          </AnimatedCard>
        </View>
      </EnhancedScrollView>
    </SafeArea>
  )
}
