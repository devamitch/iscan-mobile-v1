'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import React, { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as yup from 'yup'

import { AnimatedButton } from '@/components/ui/AnimatedButton/AnimatedButton'
import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { TouchableScale } from '@/components/ui/TouchableScale/TouchableScale'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuthStore } from '@/store/slices/authSlice'
import { useThemeStore } from '@/store/slices/themeSlice'
import { hapticFeedback } from '@/utils/haptics'

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

interface LoginScreenProps {
  navigation: any
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const { colors, theme } = useThemeStore()
  const { login, isLoading } = useAuthStore()
  const { trackEvent } = useAnalytics()
  const [showPassword, setShowPassword] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  const formOpacity = useSharedValue(0)
  const formTranslateY = useSharedValue(50)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  React.useEffect(() => {
    formOpacity.value = withTiming(1, { duration: 800 })
    formTranslateY.value = withSpring(0, { damping: 15, stiffness: 300 })
    trackEvent('login_screen_viewed')
  }, [])

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }))

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      hapticFeedback('medium')
      trackEvent('login_attempt', { method: 'email' })

      await login(data.email, data.password)
      trackEvent('login_success', { method: 'email' })
    } catch (error) {
      hapticFeedback('heavy')
      trackEvent('login_error', { method: 'email', error: error.message })
      Alert.alert('Login Failed', error.message || 'Please try again')
    }
  }

  const handleBiometricLogin = async () => {
    try {
      hapticFeedback('light')
      trackEvent('biometric_login_attempt')
      // Handle biometric login
    } catch (error) {
      hapticFeedback('heavy')
      Alert.alert('Biometric Login Failed', 'Please try again or use your password')
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <TouchableScale
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
            {/* <Feather name="arrow-left" size={20} color={colors.text} /> */}
          </TouchableScale>

          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: colors.text,
            }}
          >
            Welcome Back
          </Text>
        </View>

        {/* Form */}
        <Animated.View style={formStyle}>
          <GlassCard style={{ padding: 24, marginBottom: 24 }}>
            {/* Email Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: errors.email ? colors.error : colors.border,
                      paddingHorizontal: 16,
                      height: 50,
                      justifyContent: 'center',
                    }}
                  >
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        fontSize: 16,
                        color: colors.text,
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.error,
                    marginTop: 4,
                  }}
                >
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: errors.password ? colors.error : colors.border,
                      paddingHorizontal: 16,
                      height: 50,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <TextInput
                      ref={passwordRef}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />
                    <TouchableScale onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 20, color: colors.textSecondary }}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                      {/* <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} /> */}
                    </TouchableScale>
                  </View>
                )}
              />
              {errors.password && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.error,
                    marginTop: 4,
                  }}
                >
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableScale
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'flex-end', marginBottom: 24 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: '600',
                }}
              >
                Forgot Password?
              </Text>
            </TouchableScale>

            {/* Login Button */}
            <AnimatedButton
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
              size="large"
              gradient={[colors.primary, colors.primaryDark]}
              style={{ marginBottom: 16 }}
            />

            {/* Biometric Login */}
            <AnimatedButton
              title="Use Biometric"
              onPress={handleBiometricLogin}
              variant="ghost"
            //   icon={
              
            //     // <Feather name="fingerprint" size={20} color={colors.primary} />
            
            // }
            />
          </GlassCard>

          {/* Register Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableScale onPress={() => navigation.navigate('Register')}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: '600',
                }}
              >
                Sign Up
              </Text>
            </TouchableScale>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
