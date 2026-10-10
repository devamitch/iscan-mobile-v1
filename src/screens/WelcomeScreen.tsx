'use client'

import type React from 'react'
import { useEffect } from 'react'
import { Dimensions, StatusBar, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AnimatedButton } from '@/components/ui/AnimatedButton/AnimatedButton'
import { TouchableScale } from '@/components/ui/TouchableScale/TouchableScale'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useThemeStore } from '@/store/slices/themeSlice'
import { hapticFeedback } from '@/utils/haptics'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface WelcomeScreenProps {
  navigation: any
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const { colors, theme } = useThemeStore()
  const { trackEvent } = useAnalytics()

  const logoScale = useSharedValue(0)
  const titleOpacity = useSharedValue(0)
  const subtitleOpacity = useSharedValue(0)
  const buttonsOpacity = useSharedValue(0)
  const socialOpacity = useSharedValue(0)

  useEffect(() => {
    // Entrance animations
    logoScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }))
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 800 }))
    buttonsOpacity.value = withDelay(900, withTiming(1, { duration: 800 }))
    socialOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }))

    trackEvent('welcome_screen_viewed')
  }, [])

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }))

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }))

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }))

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }))

  const socialStyle = useAnimatedStyle(() => ({
    opacity: socialOpacity.value,
  }))

  const handleLogin = () => {
    hapticFeedback('medium')
    trackEvent('welcome_login_pressed')
    navigation.navigate('Login')
  }

  const handleRegister = () => {
    hapticFeedback('medium')
    trackEvent('welcome_register_pressed')
    navigation.navigate('Register')
  }

  const handleSocialLogin = (provider: string) => {
    hapticFeedback('light')
    trackEvent('welcome_social_login', { provider })
    // Handle social login
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Background Pattern */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
        }}
      >
        {Array.from({ length: 50 }).map((_, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: 'white',
              left: Math.random() * SCREEN_WIDTH,
              top: Math.random() * SCREEN_HEIGHT,
            }}
          />
        ))}
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 60,
          paddingHorizontal: 32,
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Animated.View style={[logoStyle, { marginBottom: 40 }]}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* <Feather name="eye" size={60} color="white" /> */}
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={[
            {
              fontSize: 32,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: 16,
            },
            titleStyle,
          ]}
        >
          AEye Scan
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            {
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 60,
            },
            subtitleStyle,
          ]}
        >
          Advanced biometric scanning with AI-powered analysis
        </Animated.Text>

        {/* Buttons */}
        <Animated.View style={[{ width: '100%' }, buttonsStyle]}>
          <AnimatedButton
            title="Get Started"
            onPress={handleRegister}
            variant="glass"
            size="large"
            style={{ marginBottom: 16 }}
            hapticType="medium"
          />

          <AnimatedButton
            title="Sign In"
            onPress={handleLogin}
            variant="ghost"
            size="large"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }}
            textStyle={{ color: 'white' }}
            hapticType="light"
          />
        </Animated.View>

        {/* Social Login */}
        <Animated.View
          style={[
            {
              marginTop: 40,
              alignItems: 'center',
            },
            socialStyle,
          ]}
        >
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 20,
            }}
          >
            Or continue with
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: 20,
            }}
          >
            <TouchableScale
              onPress={() => handleSocialLogin('google')}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              <Text style={{ color: 'white', fontSize: 24 }}>G</Text>
              {/* <Feather name="chrome" size={24} color="white" /> */}
            </TouchableScale>

            <TouchableScale
              onPress={() => handleSocialLogin('apple')}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              <Text style={{ color: 'white', fontSize: 24 }}>A</Text>
              {/* <Feather name="smartphone" size={24} color="white" /> */}
            </TouchableScale>

            <TouchableScale
              onPress={() => handleSocialLogin('facebook')}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              <Text style={{ color: 'white', fontSize: 24 }}>F</Text>
              {/* <Feather name="facebook" size={24} color="white" /> */}
            </TouchableScale>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Text */}
      <View
        style={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 32,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            lineHeight: 16,
          }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  )
}
