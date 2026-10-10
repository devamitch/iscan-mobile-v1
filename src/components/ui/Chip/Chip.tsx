'use client'

import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useTheme } from '../../../themes/ThemeProvider'
import type { ChipProps } from '../../../types/components'
import { hapticFeedback } from '../../../utils/haptics'

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  onDelete,
  icon,
  avatar,
  disabled = false,
  variant = 'filled',
  size = 'medium',
}) => {
  const theme = useTheme()
  const scale = useSharedValue(1)
  const backgroundColor = useSharedValue(0)

  React.useEffect(() => {
    backgroundColor.value = withTiming(selected ? 1 : 0, { duration: 200 })
  }, [selected])

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onStart(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
      runOnJS(hapticFeedback)('light')
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      if (onPress) {
        runOnJS(onPress)()
      }
    })

  const deleteGesture = Gesture.Tap()
    .enabled(!disabled && !!onDelete)
    .onEnd(() => {
      runOnJS(hapticFeedback)('medium')
      if (onDelete) {
        runOnJS(onDelete)()
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const bgColor = variant === 'filled' ? (selected ? theme.colors.primary : theme.colors.surface) : 'transparent'

    return {
      backgroundColor: bgColor,
    }
  })

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 24,
          paddingHorizontal: 8,
          fontSize: 12,
          iconSize: 16,
        }
      case 'medium':
        return {
          height: 32,
          paddingHorizontal: 12,
          fontSize: 14,
          iconSize: 18,
        }
      case 'large':
        return {
          height: 40,
          paddingHorizontal: 16,
          fontSize: 16,
          iconSize: 20,
        }
      default:
        return {
          height: 32,
          paddingHorizontal: 12,
          fontSize: 14,
          iconSize: 18,
        }
    }
  }

  const sizeStyles = getSizeStyles()

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primary + '20' : 'transparent',
        }
      case 'filter':
        return {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          elevation: selected ? 4 : 2,
        }
      default:
        return {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        }
    }
  }

  const variantStyles = getVariantStyles()

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: sizeStyles.height,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: sizeStyles.height / 2,
      ...variantStyles,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: sizeStyles.height - 8,
      height: sizeStyles.height - 8,
      borderRadius: (sizeStyles.height - 8) / 2,
      marginRight: 6,
    },
    icon: {
      marginRight: 6,
    },
    label: {
      fontSize: sizeStyles.fontSize,
      fontWeight: '500',
      color: selected ? theme.colors.surface : theme.colors.text,
    },
    deleteButton: {
      marginLeft: 6,
      padding: 2,
    },
  })

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.container, backgroundAnimatedStyle, animatedStyle]}>
        <View style={styles.content}>
          {avatar && <Image source={{ uri: avatar }} style={styles.avatar} />}
          {icon && (
            <Icon
              name={icon}
              size={sizeStyles.iconSize}
              color={selected ? theme.colors.surface : theme.colors.text}
              style={styles.icon}
            />
          )}
          <Text style={styles.label}>{label}</Text>
        </View>

        {onDelete && (
          <GestureDetector gesture={deleteGesture}>
            <TouchableOpacity style={styles.deleteButton} disabled={disabled}>
              <Icon
                name="close"
                size={sizeStyles.iconSize - 2}
                color={selected ? theme.colors.surface : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </GestureDetector>
        )}
      </Animated.View>
    </GestureDetector>
  )
}
