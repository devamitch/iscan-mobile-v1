'use client'

import { BlurView } from '@react-native-community/blur'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { runOnJS } from 'react-native-reanimated'
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg'
import Icon from 'react-native-vector-icons/Ionicons'
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera'

import { mediaPipeService, type FaceDetectionResult } from '@/services/mediapipe/MediaPipeService'
import { useTheme } from '@/themes/ThemeProvider'
import { HapticFeedback } from '@/utils/haptics'

const { width, height } = Dimensions.get('window')

interface HolographicScannerProps {
  scanType: 'face' | 'iris' | 'hand' | 'pose' | 'holistic'
  onScanComplete: (results: any) => void
  onError: (error: string) => void
}

export const HolographicScanner: React.FC<HolographicScannerProps> = ({ scanType, onScanComplete, onError }) => {
  const { colors } = useTheme()
  const devices = useCameraDevices()
  const device = devices.front

  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [detectionResults, setDetectionResults] = useState<any>(null)

  // Animations
  const scanLineAnimation = useRef(new Animated.Value(0)).current
  const pulseAnimation = useRef(new Animated.Value(1)).current
  const glowAnimation = useRef(new Animated.Value(0)).current
  const progressAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    startScanAnimation()
    return () => {
      stopScanAnimation()
    }
  }, [])

  const startScanAnimation = () => {
    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }

  const stopScanAnimation = () => {
    scanLineAnimation.stopAnimation()
    pulseAnimation.stopAnimation()
    glowAnimation.stopAnimation()
  }

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet'

      if (!isScanning) return

      try {
        const imageData = frame.toString()
        const timestamp = Date.now()

        switch (scanType) {
          case 'face':
            mediaPipeService.detectFaces(imageData, timestamp).then((results) => {
              runOnJS(handleDetectionResults)(results)
            })
            break
          case 'hand':
            mediaPipeService.trackHands(imageData, timestamp).then((results) => {
              runOnJS(handleDetectionResults)(results)
            })
            break
          case 'pose':
            mediaPipeService.estimatePose(imageData, timestamp).then((results) => {
              runOnJS(handleDetectionResults)(results)
            })
            break
          case 'holistic':
            mediaPipeService.processHolistic(imageData, timestamp).then((results) => {
              runOnJS(handleDetectionResults)(results)
            })
            break
        }
      } catch (error) {
        runOnJS(onError)('Frame processing error')
      }
    },
    [isScanning, scanType],
  )

  const handleDetectionResults = (results: any) => {
    setDetectionResults(results)

    if (results && Object.keys(results).length > 0) {
      const newProgress = Math.min(scanProgress + 10, 100)
      setScanProgress(newProgress)

      Animated.timing(progressAnimation, {
        toValue: newProgress / 100,
        duration: 200,
        useNativeDriver: false,
      }).start()

      if (newProgress >= 100) {
        completeScan(results)
      }
    }
  }

  const completeScan = (results: any) => {
    setIsScanning(false)
    HapticFeedback.success()
    onScanComplete(results)
  }

  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    HapticFeedback.impact()
  }

  const stopScan = () => {
    setIsScanning(false)
    setScanProgress(0)
    progressAnimation.setValue(0)
  }

  if (!device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>Camera not available</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={30}
      />

      {/* Holographic Overlay */}
      <View style={styles.overlay}>
        {/* Scanning Frame */}
        <Animated.View
          style={[
            styles.scanFrame,
            {
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        >
          <Svg width={300} height={300} style={styles.scanFrameSvg}>
            <Defs>
              <RadialGradient id="scanGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
                <Stop offset="70%" stopColor={colors.secondary} stopOpacity="0.4" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Corner brackets */}
            <Path
              d="M 50 50 L 50 80 L 80 80"
              stroke={colors.primary}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M 250 50 L 250 80 L 220 80"
              stroke={colors.primary}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M 50 250 L 50 220 L 80 220"
              stroke={colors.primary}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M 250 250 L 250 220 L 220 220"
              stroke={colors.primary}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            {/* Center circle */}
            <Circle
              cx="150"
              cy="150"
              r="100"
              stroke={colors.primary}
              strokeWidth="2"
              fill="url(#scanGradient)"
              opacity={0.3}
            />

            {/* Progress circle */}
            <Circle
              cx="150"
              cy="150"
              r="120"
              stroke={colors.secondary}
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={2 * Math.PI * 120 * (1 - scanProgress / 100)}
              strokeLinecap="round"
              transform="rotate(-90 150 150)"
            />
          </Svg>

          {/* Scanning line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-150, 150],
                    }),
                  },
                ],
                opacity: glowAnimation,
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', colors.primary + '80', colors.primary, colors.primary + '80', 'transparent']}
              style={styles.scanLineGradient}
            />
          </Animated.View>
        </Animated.View>

        {/* Detection Overlay */}
        {detectionResults && scanType === 'face' && <FaceDetectionOverlay results={detectionResults} />}

        {/* Status Panel */}
        <BlurView style={styles.statusPanel} blurType="dark" blurAmount={20}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>{getScanTypeTitle(scanType)}</Text>
          <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
            {isScanning ? 'Scanning...' : 'Ready to scan'}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>{scanProgress}%</Text>
          </View>
        </BlurView>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isScanning ? colors.error : colors.primary }]}
            onPress={isScanning ? stopScan : startScan}
          >
            <Icon name={isScanning ? 'stop' : 'scan'} size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const FaceDetectionOverlay: React.FC<{ results: FaceDetectionResult }> = ({ results }) => {
  const { colors } = useTheme()

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {results.detections.map((detection, index) => (
        <React.Fragment key={index}>
          {/* Bounding box */}
          <Path
            d={`M ${detection.boundingBox.x} ${detection.boundingBox.y} 
                L ${detection.boundingBox.x + detection.boundingBox.width} ${detection.boundingBox.y}
                L ${detection.boundingBox.x + detection.boundingBox.width} ${
              detection.boundingBox.y + detection.boundingBox.height
            }
                L ${detection.boundingBox.x} ${detection.boundingBox.y + detection.boundingBox.height}
                Z`}
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
          />

          {/* Keypoints */}
          {detection.keypoints.map((keypoint, kpIndex) => (
            <Circle key={kpIndex} cx={keypoint.x} cy={keypoint.y} r="3" fill={colors.secondary} />
          ))}
        </React.Fragment>
      ))}
    </Svg>
  )
}

const getScanTypeTitle = (scanType: string): string => {
  switch (scanType) {
    case 'face':
      return 'Face Detection'
    case 'iris':
      return 'Iris Recognition'
    case 'hand':
      return 'Hand Tracking'
    case 'pose':
      return 'Pose Estimation'
    case 'holistic':
      return 'Holistic Analysis'
    default:
      return 'Biometric Scan'
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameSvg: {
    position: 'absolute',
  },
  scanLine: {
    position: 'absolute',
    width: 200,
    height: 4,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 2,
  },
  statusPanel: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
})
