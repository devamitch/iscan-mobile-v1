'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigation } from '@react-navigation/native'
import type React from 'react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Ionicons'
import * as yup from 'yup'

import { AnimatedButton } from '@/components/ui/AnimatedButton/AnimatedButton'
import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { Input } from '@/components/ui/Input/Input'
import { TouchableScale } from '@/components/ui/TouchableScale/TouchableScale'
import { useAuthStore } from '@/store/slices/authSlice'
import { useTheme } from '@/themes/ThemeProvider'
import { HapticFeedback } from '@/utils/haptics'

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  agreeToTerms: yup.boolean().oneOf([true], 'You must agree to the terms'),
})

type FormData = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export const RegisterScreen: React.FC = () => {
  const { colors, spacing } = useTheme()
  const navigation = useNavigation()
  const { signUp } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      HapticFeedback.success()
    } catch (error) {
      HapticFeedback.error()
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const toggleTermsAgreement = () => {
    setAgreeToTerms(!agreeToTerms)
    HapticFeedback.selection()
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={[colors.primary + '20', colors.secondary + '20']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableScale onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableScale>

          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join AEye Scan and unlock advanced biometric features
          </Text>
        </View>

        {/* Registration Form */}
        <GlassCard style={styles.formCard}>
          <View style={styles.nameRow}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                  leftIcon="person"
                  containerStyle={styles.halfInput}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                  leftIcon="person"
                  containerStyle={styles.halfInput}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Create a password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon="lock-closed"
                secure
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                leftIcon="lock-closed"
                secure
              />
            )}
          />

          {/* Terms Agreement */}
          <TouchableScale onPress={toggleTermsAgreement} style={styles.termsContainer}>
            <View style={[styles.checkbox, { borderColor: colors.border }]}>
              {agreeToTerms && <Icon name="checkmark" size={16} color={colors.primary} />}
            </View>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              I agree to the <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </TouchableScale>

          <AnimatedButton
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={!agreeToTerms}
            variant="gradient"
            size="large"
            animationType="bounce"
            style={styles.registerButton}
          />
        </GlassCard>

        {/* Sign In Link */}
        <View style={styles.signInLink}>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableScale onPress={() => navigation.navigate('Login' as never)}>
            <Text style={[styles.signInLinkText, { color: colors.primary }]}>Sign In</Text>
          </TouchableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  formCard: {
    padding: 24,
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  registerButton: {
    marginTop: 8,
  },
  signInLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
  },
  signInLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
