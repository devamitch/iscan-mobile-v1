'use client'

import { LottieView } from '@/components/ui/LottieView/LottieView'
import type React from 'react'
import { useEffect } from 'react'
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

interface LoadingScreenProps {
  message?: string
  progress?: number
  showProgress?: boolean
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  progress = 0,
  showProgress = false,
}) => {
  const fadeAnim = new Animated.Value(0)
  const scaleAnim = new Animated.Value(0.8)
  const progressAnim = new Animated.Value(0)

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, scaleAnim])

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }, [progress, showProgress, progressAnim])

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.gradient}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo/Animation */}
          <View style={styles.logoContainer}>
            <LottieView source={require('@/assets/json/loading.json')} autoPlay loop style={styles.lottie} />
          </View>

          {/* App Name */}
          <Text style={styles.appName}>AEye Scan</Text>

          {/* Loading Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Progress Bar */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}

          {/* Floating Particles */}
          <FloatingParticles />
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 6 }, (_, index) => {
    const animValue = new Animated.Value(0)

    useEffect(() => {
      const animate = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
          ]),
        ).start()
      }

      setTimeout(animate, index * 200)
    }, [animValue, index])

    return (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          {
            left: Math.random() * width,
            top: Math.random() * height,
            opacity: animValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                }),
              },
              {
                scale: animValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
              },
            ],
          },
        ]}
      />
    )
  })

  return <>{particles}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
})
