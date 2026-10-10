'use client'

import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg'
import Icon from 'react-native-vector-icons/Ionicons'

import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { HolographicScanner } from '@/components/ui/Scanner/HolographicScanner'
import { useIrisRecognition } from '@/hooks/useIrisRecognition'
import { useTheme } from '@/themes/ThemeProvider'
import { HapticFeedback } from '@/utils/haptics'

const { width, height } = Dimensions.get('window')

interface IrisData {
  id: string
  patterns: number[][]
  confidence: number
  timestamp: Date
  eyePosition: 'left' | 'right'
}

export const IrisRecognitionScreen: React.FC = () => {
  const { colors } = useTheme()
  const { recognizeIris, enrollIris, verifyIris } = useIrisRecognition()

  const [mode, setMode] = useState<'enroll' | 'verify'>('verify')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [irisData, setIrisData] = useState<IrisData | null>(null)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    confidence: number
    matchedId?: string
  } | null>(null)

  // Animations
  const irisAnimation = useSharedValue(0)
  const glowAnimation = useSharedValue(0)
  const resultAnimation = useSharedValue(0)

  useEffect(() => {
    startIrisAnimation()
  }, [])

  const startIrisAnimation = () => {
    // Iris scanning animation
    irisAnimation.value = withTiming(1, { duration: 2000 })

    // Glow effect
    glowAnimation.value = withTiming(1, { duration: 1500 })
  }

  const handleScanComplete = async (results: any) => {
    try {
      setIsScanning(false)
      HapticFeedback.success()

      const processedIrisData = await recognizeIris(results)
      setIrisData(processedIrisData)

      if (mode === 'enroll') {
        await handleEnrollment(processedIrisData)
      } else {
        await handleVerification(processedIrisData)
      }
    } catch (error) {
      console.error('Iris processing error:', error)
      Alert.alert('Error', 'Failed to process iris scan')
      HapticFeedback.error()
    }
  }

  const handleEnrollment = async (data: IrisData) => {
    try {
      const enrollmentResult = await enrollIris(data)

      resultAnimation.value = withSpring(1)

      Alert.alert('Enrollment Successful', `Iris pattern enrolled with ID: ${enrollmentResult.id}`, [
        { text: 'OK', onPress: () => resetScan() },
      ])
    } catch (error) {
      Alert.alert('Enrollment Failed', 'Could not enroll iris pattern')
    }
  }

  const handleVerification = async (data: IrisData) => {
    try {
      const result = await verifyIris(data)
      setVerificationResult(result)

      resultAnimation.value = withSpring(1)

      setTimeout(() => {
        Alert.alert(
          result.success ? 'Verification Successful' : 'Verification Failed',
          result.success
            ? `Match found with confidence: ${(result.confidence * 100).toFixed(1)}%`
            : 'No matching iris pattern found',
          [{ text: 'OK', onPress: () => resetScan() }],
        )
      }, 1000)
    } catch (error) {
      Alert.alert('Verification Failed', 'Could not verify iris pattern')
    }
  }

  const resetScan = () => {
    setIsScanning(false)
    setScanProgress(0)
    setIrisData(null)
    setVerificationResult(null)
    irisAnimation.value = 0
    glowAnimation.value = 0
    resultAnimation.value = 0
    startIrisAnimation()
  }

  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    HapticFeedback.impact()
  }

  const irisAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(irisAnimation.value, [0, 1], [0.8, 1.2]),
      },
    ],
    opacity: irisAnimation.value,
  }))

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnimation.value, [0, 1], [0.3, 1]),
  }))

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(resultAnimation.value, [0, 1], [0.5, 1]),
      },
    ],
    opacity: resultAnimation.value,
  }))

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={[colors.primary + '40', colors.secondary + '40']} style={styles.header}>
        <BlurView style={styles.headerContent} blurType="dark" blurAmount={20}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Iris Recognition</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Advanced biometric authentication
          </Text>
        </BlurView>
      </LinearGradient>

      {/* Mode Selector */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: mode === 'enroll' ? colors.primary : colors.surface,
            },
          ]}
          onPress={() => setMode('enroll')}
        >
          <Icon name="person-add" size={20} color={mode === 'enroll' ? colors.background : colors.text} />
          <Text
            style={[
              styles.modeText,
              {
                color: mode === 'enroll' ? colors.background : colors.text,
              },
            ]}
          >
            Enroll
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: mode === 'verify' ? colors.primary : colors.surface,
            },
          ]}
          onPress={() => setMode('verify')}
        >
          <Icon name="shield-checkmark" size={20} color={mode === 'verify' ? colors.background : colors.text} />
          <Text
            style={[
              styles.modeText,
              {
                color: mode === 'verify' ? colors.background : colors.text,
              },
            ]}
          >
            Verify
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <HolographicScanner
          scanType="iris"
          onScanComplete={handleScanComplete}
          onError={(error) => Alert.alert('Scan Error', error)}
        />

        {/* Iris Overlay */}
        <View style={styles.irisOverlay}>
          <Animated.View style={[styles.irisContainer, irisAnimatedStyle]}>
            <Svg width={200} height={200}>
              <Defs>
                <RadialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
                  <Stop offset="30%" stopColor={colors.secondary} stopOpacity="0.6" />
                  <Stop offset="70%" stopColor={colors.accent} stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </RadialGradient>
              </Defs>

              {/* Outer iris ring */}
              <Circle
                cx="100"
                cy="100"
                r="80"
                stroke={colors.primary}
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
              />

              {/* Middle iris ring */}
              <Circle cx="100" cy="100" r="60" stroke={colors.secondary} strokeWidth="1.5" fill="none" />

              {/* Inner iris pattern */}
              <Circle cx="100" cy="100" r="40" fill="url(#irisGradient)" />

              {/* Pupil */}
              <Circle cx="100" cy="100" r="20" fill={colors.background} stroke={colors.primary} strokeWidth="1" />

              {/* Iris pattern lines */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = i * 30 * (Math.PI / 180)
                const x1 = 100 + Math.cos(angle) * 25
                const y1 = 100 + Math.sin(angle) * 25
                const x2 = 100 + Math.cos(angle) * 75
                const y2 = 100 + Math.sin(angle) * 75

                return (
                  <Path
                    key={i}
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    stroke={colors.accent}
                    strokeWidth="0.5"
                    opacity="0.6"
                  />
                )
              })}
            </Svg>

            {/* Glow effect */}
            <Animated.View style={[styles.glowEffect, glowAnimatedStyle]}>
              <LinearGradient
                colors={[colors.primary + '00', colors.primary + '40', colors.secondary + '40', colors.primary + '00']}
                style={styles.glowGradient}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Instructions */}
        <GlassCard style={styles.instructionsCard}>
          <Icon name="eye" size={32} color={colors.primary} />
          <Text style={[styles.instructionTitle, { color: colors.text }]}>
            {mode === 'enroll' ? 'Enroll Your Iris' : 'Verify Your Identity'}
          </Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            {mode === 'enroll'
              ? 'Look directly at the camera and keep your eye open'
              : 'Position your eye in the center and hold steady'}
          </Text>
        </GlassCard>
      </View>

      {/* Results */}
      {verificationResult && (
        <Animated.View style={[styles.resultContainer, resultAnimatedStyle]}>
          <GlassCard
            style={[
              styles.resultCard,
              {
                borderColor: verificationResult.success ? colors.success : colors.error,
                borderWidth: 2,
              },
            ]}
          >
            <Icon
              name={verificationResult.success ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={verificationResult.success ? colors.success : colors.error}
            />
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              Confidence: {(verificationResult.confidence * 100).toFixed(1)}%
            </Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.scanButton,
            {
              backgroundColor: isScanning ? colors.error : colors.primary,
            },
          ]}
          onPress={isScanning ? resetScan : startScan}
        >
          <Icon name={isScanning ? 'stop' : 'scan'} size={24} color={colors.background} />
          <Text style={[styles.scanButtonText, { color: colors.background }]}>
            {isScanning ? 'Stop Scan' : 'Start Scan'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 120,
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  modeContainer: {
    flexDirection: 'row',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  irisOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    zIndex: 10,
  },
  irisContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -10,
    left: -10,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 110,
  },
  instructionsCard: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    padding: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -50 }],
    zIndex: 20,
  },
  resultCard: {
    padding: 30,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
})
