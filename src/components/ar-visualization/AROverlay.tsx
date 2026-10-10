"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, StyleSheet, Dimensions, Text } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated"
import Svg, { Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg"

import { useTheme } from "@/themes/ThemeProvider"
import type { HolisticResult, HandTrackingResult, PoseEstimationResult } from "@/services/mediapipe/MediaPipeService"

const { width, height } = Dimensions.get("window")

interface AROverlayProps {
  holisticData?: HolisticResult
  handData?: HandTrackingResult[]
  poseData?: PoseEstimationResult
  showSkeleton?: boolean
  showLandmarks?: boolean
  showConnections?: boolean
  overlayType: "holistic" | "hands" | "pose" | "face"
}

// Hand landmark connections
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index finger
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle finger
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring finger
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
  [5, 9],
  [9, 13],
  [13, 17], // Palm connections
]

// Pose landmark connections
const POSE_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16], // Arms
  [11, 23],
  [12, 24],
  [23, 24], // Torso
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31], // Left leg
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32], // Right leg
  [15, 17],
  [15, 19],
  [15, 21],
  [16, 18],
  [16, 20],
  [16, 22], // Hands
  [27, 31],
  [28, 32], // Feet
]

export const AROverlay: React.FC<AROverlayProps> = ({
  holisticData,
  handData,
  poseData,
  showSkeleton = true,
  showLandmarks = true,
  showConnections = true,
  overlayType,
}) => {
  const { colors } = useTheme()
  const [animationProgress, setAnimationProgress] = useState(0)

  // Animations
  const fadeAnimation = useSharedValue(0)
  const scaleAnimation = useSharedValue(0.8)
  const glowAnimation = useSharedValue(0)

  useEffect(() => {
    // Animate overlay appearance
    fadeAnimation.value = withTiming(1, { duration: 500 })
    scaleAnimation.value = withSpring(1, { damping: 15 })

    // Continuous glow animation
    const glowLoop = () => {
      glowAnimation.value = withTiming(1, { duration: 1000 }, () => {
        glowAnimation.value = withTiming(0, { duration: 1000 }, glowLoop)
      })
    }
    glowLoop()
  }, [])

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnimation.value,
    transform: [{ scale: scaleAnimation.value }],
  }))

  const renderHandLandmarks = (hand: HandTrackingResult, index: number) => {
    const handColor = hand.handedness === "Left" ? colors.primary : colors.secondary
    const glowOpacity = interpolate(glowAnimation.value, [0, 1], [0.3, 0.8])

    return (
      <Svg key={`hand-${index}`} width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id={`handGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={handColor} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={handColor} stopOpacity="0.4" />
          </SvgLinearGradient>
        </Defs>

        {/* Hand connections */}
        {showConnections &&
          HAND_CONNECTIONS.map((connection, connIndex) => {
            const [startIdx, endIdx] = connection
            const startPoint = hand.landmarks[startIdx]
            const endPoint = hand.landmarks[endIdx]

            if (!startPoint || !endPoint) return null

            return (
              <Line
                key={`connection-${connIndex}`}
                x1={startPoint.x * width}
                y1={startPoint.y * height}
                x2={endPoint.x * width}
                y2={endPoint.y * height}
                stroke={handColor}
                strokeWidth="2"
                strokeOpacity={glowOpacity}
              />
            )
          })}

        {/* Hand landmarks */}
        {showLandmarks &&
          hand.landmarks.map((landmark, lmIndex) => (
            <Circle
              key={`landmark-${lmIndex}`}
              cx={landmark.x * width}
              cy={landmark.y * height}
              r={lmIndex === 0 ? "8" : "4"} // Wrist is larger
              fill={`url(#handGradient-${index})`}
              stroke={handColor}
              strokeWidth="1"
            />
          ))}

        {/* Hand label */}
        <SvgText
          x={hand.landmarks[0]?.x * width || 0}
          y={(hand.landmarks[0]?.y * height || 0) - 20}
          fontSize="14"
          fill={handColor}
          textAnchor="middle"
          fontWeight="bold"
        >
          {hand.handedness} Hand ({(hand.confidence * 100).toFixed(0)}%)
        </SvgText>
      </Svg>
    )
  }

  const renderPoseLandmarks = (pose: PoseEstimationResult) => {
    const glowOpacity = interpolate(glowAnimation.value, [0, 1], [0.4, 1])

    return (
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="poseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
            <Stop offset="50%" stopColor={colors.primary} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.4" />
          </SvgLinearGradient>
        </Defs>

        {/* Pose connections */}
        {showConnections &&
          POSE_CONNECTIONS.map((connection, connIndex) => {
            const [startIdx, endIdx] = connection
            const startPoint = pose.landmarks[startIdx]
            const endPoint = pose.landmarks[endIdx]

            if (!startPoint || !endPoint || startPoint.visibility < 0.5 || endPoint.visibility < 0.5) {
              return null
            }

            return (
              <Line
                key={`pose-connection-${connIndex}`}
                x1={startPoint.x * width}
                y1={startPoint.y * height}
                x2={endPoint.x * width}
                y2={endPoint.y * height}
                stroke={colors.accent}
                strokeWidth="3"
                strokeOpacity={glowOpacity * Math.min(startPoint.visibility, endPoint.visibility)}
              />
            )
          })}

        {/* Pose landmarks */}
        {showLandmarks &&
          pose.landmarks.map((landmark, lmIndex) => {
            if (landmark.visibility < 0.5) return null

            return (
              <Circle
                key={`pose-landmark-${lmIndex}`}
                cx={landmark.x * width}
                cy={landmark.y * height}
                r="6"
                fill="url(#poseGradient)"
                stroke={colors.accent}
                strokeWidth="2"
                opacity={landmark.visibility}
              />
            )
          })}
      </Svg>
    )
  }

  const renderHolisticOverlay = (holistic: HolisticResult) => {
    return (
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="holisticGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
            <Stop offset="33%" stopColor={colors.secondary} stopOpacity="0.6" />
            <Stop offset="66%" stopColor={colors.accent} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={colors.warning} stopOpacity="0.4" />
          </SvgLinearGradient>
        </Defs>

        {/* Face landmarks */}
        {holistic.faceLandmarks && showLandmarks && (
          <>
            {holistic.faceLandmarks.slice(0, 17).map(
              (
                landmark,
                index, // Face contour
              ) => (
                <Circle
                  key={`face-${index}`}
                  cx={landmark.x * width}
                  cy={landmark.y * height}
                  r="2"
                  fill={colors.primary}
                  opacity="0.7"
                />
              ),
            )}
          </>
        )}

        {/* Pose skeleton */}
        {holistic.poseLandmarks && renderPoseFromHolistic(holistic.poseLandmarks)}

        {/* Hand landmarks */}
        {holistic.leftHandLandmarks && renderHandFromHolistic(holistic.leftHandLandmarks, "Left")}
        {holistic.rightHandLandmarks && renderHandFromHolistic(holistic.rightHandLandmarks, "Right")}
      </Svg>
    )
  }

  const renderHandFromHolistic = (landmarks: Array<{ x: number; y: number; z: number }>, handedness: string) => {
    const handColor = handedness === "Left" ? colors.primary : colors.secondary

    return (
      <>
        {/* Hand connections */}
        {showConnections &&
          HAND_CONNECTIONS.map((connection, connIndex) => {
            const [startIdx, endIdx] = connection
            const startPoint = landmarks[startIdx]
            const endPoint = landmarks[endIdx]

            if (!startPoint || !endPoint) return null

            return (
              <Line
                key={`holistic-hand-${handedness}-connection-${connIndex}`}
                x1={startPoint.x * width}
                y1={startPoint.y * height}
                x2={endPoint.x * width}
                y2={endPoint.y * height}
                stroke={handColor}
                strokeWidth="2"
                strokeOpacity="0.8"
              />
            )
          })}

        {/* Hand landmarks */}
        {showLandmarks &&
          landmarks.map((landmark, lmIndex) => (
            <Circle
              key={`holistic-hand-${handedness}-landmark-${lmIndex}`}
              cx={landmark.x * width}
              cy={landmark.y * height}
              r={lmIndex === 0 ? "6" : "3"}
              fill={handColor}
              stroke={handColor}
              strokeWidth="1"
              opacity="0.8"
            />
          ))}
      </>
    )
  }

  const renderPoseFromHolistic = (landmarks: Array<{ x: number; y: number; z: number; visibility: number }>) => {
    return (
      <>
        {/* Pose connections */}
        {showConnections &&
          POSE_CONNECTIONS.map((connection, connIndex) => {
            const [startIdx, endIdx] = connection
            const startPoint = landmarks[startIdx]
            const endPoint = landmarks[endIdx]

            if (!startPoint || !endPoint || startPoint.visibility < 0.5 || endPoint.visibility < 0.5) {
              return null
            }

            return (
              <Line
                key={`holistic-pose-connection-${connIndex}`}
                x1={startPoint.x * width}
                y1={startPoint.y * height}
                x2={endPoint.x * width}
                y2={endPoint.y * height}
                stroke={colors.accent}
                strokeWidth="3"
                strokeOpacity={Math.min(startPoint.visibility, endPoint.visibility)}
              />
            )
          })}

        {/* Pose landmarks */}
        {showLandmarks &&
          landmarks.map((landmark, lmIndex) => {
            if (landmark.visibility < 0.5) return null

            return (
              <Circle
                key={`holistic-pose-landmark-${lmIndex}`}
                cx={landmark.x * width}
                cy={landmark.y * height}
                r="5"
                fill={colors.accent}
                stroke={colors.accent}
                strokeWidth="2"
                opacity={landmark.visibility}
              />
            )
          })}
      </>
    )
  }

  return (
    <Animated.View style={[styles.container, overlayAnimatedStyle]}>
      {/* Render based on overlay type */}
      {overlayType === "hands" && handData && handData.map(renderHandLandmarks)}

      {overlayType === "pose" && poseData && renderPoseLandmarks(poseData)}

      {overlayType === "holistic" && holisticData && renderHolisticOverlay(holisticData)}

      {/* Info panel */}
      <View style={styles.infoPanel}>
        <Text style={[styles.infoText, { color: colors.text }]}>
          {overlayType.charAt(0).toUpperCase() + overlayType.slice(1)} Tracking
        </Text>
        {overlayType === "hands" && handData && (
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            {handData.length} hand{handData.length !== 1 ? "s" : ""} detected
          </Text>
        )}
        {overlayType === "pose" && poseData && (
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            Confidence: {(poseData.confidence * 100).toFixed(0)}%
          </Text>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  infoPanel: {
    position: "absolute",
    top: 60,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backdropFilter: "blur(10px)",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  infoSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
})
