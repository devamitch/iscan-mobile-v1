'use client'

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '../../../themes/ThemeProvider'
import type { ProgressProps } from '../../../types/components'

export const Progress: React.FC<ProgressProps> = ({
  progress,
  animated = true,
  color,
  backgroundColor,
  height = 8,
  borderRadius,
  showLabel = false,
  labelPosition = 'top',
}) => {
  const theme = useTheme()
  const progressValue = useSharedValue(0)

  React.useEffect(() => {
    if (animated) {
      progressValue.value = withSpring(progress, { damping: 15, stiffness: 100 })
    } else {
      progressValue.value = progress
    }
  }, [progress, animated])

  const progressAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(progressValue.value, [0, 1], [0, 100])

    return {
      width: `${width}%`,
    }
  })

  const colorAnimatedStyle = useAnimatedStyle(() => {
    const bgColor = color || theme.colors.primary
    const animatedColor = interpolateColor(progressValue.value, [0, 0.5, 1], [bgColor + '60', bgColor + '80', bgColor])

    return {
      backgroundColor: animatedColor,
    }
  })

  const getLabel = () => {
    const percentage = Math.round(progress * 100)
    return `${percentage}%`
  }

  const styles = StyleSheet.create({
    container: {
      width: '100%',
    },
    labelContainer: {
      marginBottom: labelPosition === 'top' ? theme.spacing.xs : 0,
      marginTop: labelPosition === 'bottom' ? theme.spacing.xs : 0,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: labelPosition === 'center' ? 'center' : 'left',
    },
    track: {
      width: '100%',
      height: height,
      backgroundColor: backgroundColor || theme.colors.border,
      borderRadius: borderRadius !== undefined ? borderRadius : height / 2,
      overflow: 'hidden',
      position: 'relative',
    },
    progress: {
      height: '100%',
      borderRadius: borderRadius !== undefined ? borderRadius : height / 2,
    },
    centerLabel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerLabelText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.surface,
    },
  })

  return (
    <View style={styles.container}>
      {showLabel && labelPosition === 'top' && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{getLabel()}</Text>
        </View>
      )}

      <View style={styles.track}>
        <Animated.View style={[styles.progress, progressAnimatedStyle, colorAnimatedStyle]} />

        {showLabel && labelPosition === 'center' && (
          <View style={styles.centerLabel}>
            <Text style={styles.centerLabelText}>{getLabel()}</Text>
          </View>
        )}
      </View>

      {showLabel && labelPosition === 'bottom' && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{getLabel()}</Text>
        </View>
      )}
    </View>
  )
}
