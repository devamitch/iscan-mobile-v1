'use client'

import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuthStore } from '@/store/slices/authSlice'
import { hapticFeedback } from '@/utils/haptics'
import type React from 'react'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

interface ForgotPasswordScreenProps {
  navigation: any
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { resetPassword } = useAuthStore()
  const { trackEvent } = useAnalytics()

  const handleResetPassword = async () => {
    if (!email.trim()) {
      hapticFeedback('error')
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    if (!isValidEmail(email)) {
      hapticFeedback('error')
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setIsLoading(true)
    hapticFeedback('light')

    try {
      await resetPassword(email)
      hapticFeedback('success')

      trackEvent('password_reset_requested', { email })

      Alert.alert(
        'Reset Link Sent',
        'A password reset link has been sent to your email address. Please check your inbox and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      )
    } catch (error) {
      hapticFeedback('error')
      console.error('Password reset error:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                hapticFeedback('selection')
                navigation.goBack()
              }}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="lock-reset" size={80} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Don't worry! Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={styles.form}>
              <Input
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="email"
                style={styles.input}
              />

              <Button
                title="Send Reset Link"
                onPress={handleResetPassword}
                loading={isLoading}
                style={styles.resetButton}
              />
            </View>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => {
                hapticFeedback('selection')
                navigation.goBack()
              }}
            >
              <Text style={styles.backToLoginText}>Remember your password? Sign In</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 10,
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
})
