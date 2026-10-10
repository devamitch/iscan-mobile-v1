'use client'

import { BlurView } from '@react-native-community/blur'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import React from 'react'
import { Dimensions, View } from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemeStore } from '@/store/slices/themeSlice'
import { hapticFeedback } from '@/utils/haptics'
import { TouchableScale } from '../TouchableScale/TouchableScale'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()
  const { colors, theme } = useThemeStore()
  const tabWidth = SCREEN_WIDTH / state.routes.length
  const translateX = useSharedValue(0)

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const animatedIconStyles = state.routes.map((_, index) => {
    const scale = interpolate(
      translateX.value,
      [(index - 1) * tabWidth, index * tabWidth, (index + 1) * tabWidth],
      [1, 1.2, 1],
      Extrapolate.CLAMP,
    )

    return {
      transform: [{ scale }],
    }
  })

  const animatedTextStyles = state.routes.map((_, index) => {
    const opacity = interpolate(
      translateX.value,
      [(index - 1) * tabWidth, index * tabWidth, (index + 1) * tabWidth],
      [0.6, 1, 0.6],
      Extrapolate.CLAMP,
    )

    return { opacity }
  })

  React.useEffect(() => {
    translateX.value = withSpring(state.index * tabWidth, {
      damping: 15,
      stiffness: 300,
    })
  }, [state.index, tabWidth])

  const getIconName = (routeName: string): keyof typeof any => {
    switch (routeName) {
      case 'Home':
        return 'home'
      case 'Scanner':
        return 'camera'
      case 'Chat':
        return 'message-circle'
      case 'Profile':
        return 'user'
      default:
        return 'circle'
    }
  }

  return (
    <BlurView
      style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 16,
        right: 16,
        height: 80,
        borderRadius: 24,
        overflow: 'hidden',
      }}
      blurType={theme.isDark ? 'dark' : 'light'}
      blurAmount={20}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1,
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderRadius: 24,
        }}
      >
        {/* Active Tab Indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 8,
              left: 8,
              width: tabWidth - 16,
              height: 64,
              backgroundColor: colors.primary,
              borderRadius: 20,
              opacity: 0.2,
            },
            indicatorStyle,
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          const onPress = () => {
            hapticFeedback('light')

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          return (
            <TouchableScale
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
              }}
              activeScale={0.95}
              hapticType="light"
            >
              <Animated.View style={[{ alignItems: 'center' }, animatedIconStyles[index]]}>
                {/* <Feather
                  name={getIconName(route.name)}
                  size={24}
                  color={isFocused ? colors.primary : colors.textSecondary}
                /> */}
              </Animated.View>

              <Animated.Text
                style={[
                  {
                    fontSize: 12,
                    fontWeight: '600',
                    color: isFocused ? colors.primary : colors.textSecondary,
                    marginTop: 4,
                  },
                  animatedTextStyles[index],
                ]}
              >
                {options.tabBarLabel || route.name}
              </Animated.Text>
            </TouchableScale>
          )
        })}
      </View>
    </BlurView>
  )
}
