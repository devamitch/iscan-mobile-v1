'use client'

import { Button } from '@/components/ui/Button/Button'
import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useBiometric } from '@/services/biometric/BiometricProvider'
import { hapticFeedback } from '@/utils/haptics'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

interface BiometricSetupScreenProps {
  navigation: any
  route: any
}

interface BiometricOption {
  type: string
  title: string
  description: string
  icon: string
  available: boolean
}

export const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({ navigation, route }) => {
  const [biometricOptions, setBiometricOptions] = useState<BiometricOption[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { biometricService } = useBiometric()
  const { trackEvent } = useAnalytics()

  const isOnboarding = route?.params?.isOnboarding || false

  useEffect(() => {
    checkBiometricAvailability()
  }, [])

  const checkBiometricAvailability = async () => {
    try {
      const availability = await biometricService.checkBiometricAvailability()

      const options: BiometricOption[] = [
        {
          type: 'fingerprint',
          title: 'Fingerprint',
          description: 'Use your fingerprint to unlock the app',
          icon: 'fingerprint',
          available: availability.fingerprint,
        },
        {
          type: 'face',
          title: 'Face Recognition',
          description: 'Use face recognition to unlock the app',
          icon: 'face',
          available: availability.face,
        },
        {
          type: 'iris',
          title: 'Iris Scan',
          description: 'Use iris scanning for enhanced security',
          icon: 'visibility',
          available: availability.iris,
        },
        {
          type: 'voice',
          title: 'Voice Recognition',
          description: 'Use your voice pattern for authentication',
          icon: 'mic',
          available: availability.voice,
        },
      ]

      setBiometricOptions(options)
    } catch (error) {
      console.error('Error checking biometric availability:', error)
    }
  }

  const toggleBiometricOption = (type: string) => {
    hapticFeedback('selection')
    setSelectedOptions((prev) => (prev.includes(type) ? prev.filter((option) => option !== type) : [...prev, type]))
  }

  const setupBiometrics = async () => {
    if (selectedOptions.length === 0) {
      hapticFeedback('warning')
      Alert.alert('No Selection', 'Please select at least one biometric method')
      return
    }

    setIsLoading(true)
    hapticFeedback('light')

    try {
      for (const biometricType of selectedOptions) {
        await biometricService.enrollBiometric(biometricType)
        trackEvent('biometric_enrolled', { type: biometricType })
      }

      hapticFeedback('success')

      Alert.alert('Setup Complete', 'Biometric authentication has been set up successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (isOnboarding) {
              navigation.navigate('NotificationPermission')
            } else {
              navigation.goBack()
            }
          },
        },
      ])
    } catch (error) {
      hapticFeedback('error')
      console.error('Biometric setup error:', error)
      Alert.alert('Setup Failed', error instanceof Error ? error.message : 'Failed to set up biometric authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const skipSetup = () => {
    hapticFeedback('selection')
    Alert.alert(
      'Skip Biometric Setup',
      'You can set up biometric authentication later in settings. Continue without biometric security?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            trackEvent('biometric_setup_skipped')
            if (isOnboarding) {
              navigation.navigate('NotificationPermission')
            } else {
              navigation.goBack()
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {!isOnboarding && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  hapticFeedback('selection')
                  navigation.goBack()
                }}
              >
                <Icon name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="security" size={80} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>Secure Your Account</Text>
            <Text style={styles.subtitle}>
              Choose your preferred biometric authentication methods for enhanced security
            </Text>

            {/* Biometric Options */}
            <View style={styles.optionsContainer}>
              {biometricOptions.map((option) => (
                <GlassCard key={option.type} style={styles.optionCard}>
                  <TouchableOpacity
                    style={[styles.option, !option.available && styles.disabledOption]}
                    onPress={() => option.available && toggleBiometricOption(option.type)}
                    disabled={!option.available}
                  >
                    <View style={styles.optionLeft}>
                      <Icon
                        name={option.icon}
                        size={32}
                        color={option.available ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
                      />
                      <View style={styles.optionText}>
                        <Text style={[styles.optionTitle, !option.available && styles.disabledText]}>
                          {option.title}
                        </Text>
                        <Text style={[styles.optionDescription, !option.available && styles.disabledText]}>
                          {option.description}
                        </Text>
                        {!option.available && <Text style={styles.unavailableText}>Not available on this device</Text>}
                      </View>
                    </View>

                    {option.available && (
                      <View style={styles.checkbox}>
                        {selectedOptions.includes(option.type) && <Icon name="check" size={20} color="#4CAF50" />}
                      </View>
                    )}
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="Set Up Biometrics"
                onPress={setupBiometrics}
                loading={isLoading}
                disabled={selectedOptions.length === 0}
                style={styles.setupButton}
              />

              {isOnboarding && (
                <TouchableOpacity style={styles.skipButton} onPress={skipSetup}>
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
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
  optionsContainer: {
    marginBottom: 40,
  },
  optionCard: {
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  unavailableText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    marginTop: 4,
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonContainer: {
    marginTop: 20,
  },
  setupButton: {
    marginBottom: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
})
