import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { View, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useThemeStore } from '@/store/slices/themeSlice'

interface GlassCardProps {
  children: React.ReactNode
  style?: ViewStyle
  blurAmount?: number
  borderRadius?: number
  borderWidth?: number
  gradient?: string[]
  shadowColor?: string
  shadowOpacity?: number
  shadowRadius?: number
  elevation?: number
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  blurAmount = 20,
  borderRadius = 16,
  borderWidth = 1,
  gradient,
  shadowColor,
  shadowOpacity = 0.1,
  shadowRadius = 10,
  elevation = 5,
}) => {
  const { colors, theme } = useThemeStore()

  const defaultGradient = theme.isDark
    ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
    : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)']

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          shadowColor: shadowColor || colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity,
          shadowRadius,
          elevation,
        },
        style,
      ]}
    >
      <BlurView
        style={{
          flex: 1,
          borderRadius,
        }}
        blurType={theme.isDark ? 'dark' : 'light'}
        blurAmount={blurAmount}
      >
        <LinearGradient
          colors={gradient || defaultGradient}
          style={{
            flex: 1,
            borderRadius,
            borderWidth,
            borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <View style={{ flex: 1, padding: 16 }}>{children}</View>
        </LinearGradient>
      </BlurView>
    </View>
  )
}
