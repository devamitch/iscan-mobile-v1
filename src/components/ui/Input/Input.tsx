"use client"

import React, { useState, useRef } from "react"
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolateColor,
} from "react-native-reanimated"
import Icon from "react-native-vector-icons/Ionicons"
import { z } from "zod"

import { useTheme } from "@/themes/ThemeProvider"

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)
const AnimatedView = Animated.createAnimatedComponent(View)

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: string
  rightIcon?: string
  onRightIconPress?: () => void
  variant?: "outlined" | "filled" | "underlined"
  size?: "small" | "medium" | "large"
  style?: ViewStyle
  inputStyle?: TextStyle
  labelStyle?: TextStyle
  errorStyle?: TextStyle
  helperStyle?: TextStyle
  required?: boolean
  disabled?: boolean
  loading?: boolean
  validationSchema?: z.ZodSchema
  validateOnChange?: boolean
  validateOnBlur?: boolean
  animateLabel?: boolean
  showCharacterCount?: boolean
  maxLength?: number
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = "outlined",
  size = "medium",
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  required = false,
  disabled = false,
  loading = false,
  validationSchema,
  validateOnChange = false,
  validateOnBlur = true,
  animateLabel = true,
  showCharacterCount = false,
  maxLength,
  value,
  onChangeText,
  onBlur,
  onFocus,
  ...textInputProps
}) => {
  const { colors, typography, spacing } = useTheme()
  const inputRef = useRef<TextInput>(null)

  const [isFocused, setIsFocused] = useState(false)
  const [internalError, setInternalError] = useState<string>("")
  const [characterCount, setCharacterCount] = useState(value?.length || 0)

  // Animation values
  const focusAnimation = useSharedValue(0)
  const labelAnimation = useSharedValue(value ? 1 : 0)
  const errorAnimation = useSharedValue(0)

  const hasError = error || internalError

  React.useEffect(() => {
    focusAnimation.value = withTiming(isFocused ? 1 : 0, { duration: 200 })
  }, [isFocused])

  React.useEffect(() => {
    if (animateLabel) {
      labelAnimation.value = withSpring(isFocused || value ? 1 : 0, { damping: 15 })
    }
  }, [isFocused, value, animateLabel])

  React.useEffect(() => {
    errorAnimation.value = withTiming(hasError ? 1 : 0, { duration: 200 })
  }, [hasError])

  const validateInput = (inputValue: string) => {
    if (!validationSchema) return

    try {
      validationSchema.parse(inputValue)
      setInternalError("")
    } catch (err) {
      if (err instanceof z.ZodError) {
        setInternalError(err.errors[0]?.message || "Invalid input")
      }
    }
  }

  const handleChangeText = (text: string) => {
    setCharacterCount(text.length)

    if (validateOnChange) {
      validateInput(text)
    }

    if (onChangeText) {
      onChangeText(text)
    }
  }

  const handleFocus = (e: any) => {
    setIsFocused(true)
    if (onFocus) {
      onFocus(e)
    }
  }

  const handleBlur = (e: any) => {
    setIsFocused(false)

    if (validateOnBlur && value) {
      validateInput(value)
    }

    if (onBlur) {
      onBlur(e)
    }
  }

  // Size configurations
  const sizeConfig = {
    small: {
      height: 40,
      fontSize: 14,
      paddingHorizontal: 12,
      iconSize: 16,
    },
    medium: {
      height: 48,
      fontSize: 16,
      paddingHorizontal: 16,
      iconSize: 20,
    },
    large: {
      height: 56,
      fontSize: 18,
      paddingHorizontal: 20,
      iconSize: 24,
    },
  }

  const currentSize = sizeConfig[size]

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [hasError ? colors.error : colors.border, hasError ? colors.error : colors.primary],
    )

    return {
      borderColor,
      borderWidth: variant === "outlined" ? (focusAnimation.value > 0 ? 2 : 1) : 0,
    }
  })

  const labelAnimatedStyle = useAnimatedStyle(() => {
    if (!animateLabel || variant === "underlined") return {}

    const translateY = labelAnimation.value * -12
    const scale = 0.8 + (1 - labelAnimation.value) * 0.2
    const color = interpolateColor(focusAnimation.value, [0, 1], [colors.textSecondary, colors.primary])

    return {
      transform: [{ translateY }, { scale }],
      color: hasError ? colors.error : color,
    }
  })

  const underlineAnimatedStyle = useAnimatedStyle(() => {
    if (variant !== "underlined") return {}

    const scaleX = focusAnimation.value
    const backgroundColor = hasError ? colors.error : colors.primary

    return {
      transform: [{ scaleX }],
      backgroundColor,
    }
  })

  const errorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: errorAnimation.value,
    transform: [
      {
        translateY: (1 - errorAnimation.value) * -10,
      },
    ],
  }))

  // Styles
  const containerStyle: ViewStyle = {
    marginBottom: spacing.md,
  }

  const inputContainerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    height: currentSize.height,
    backgroundColor: variant === "filled" ? colors.surface : "transparent",
    borderRadius: variant === "outlined" ? 8 : 0,
    paddingHorizontal: currentSize.paddingHorizontal,
    borderBottomWidth: variant === "underlined" ? 1 : 0,
    borderBottomColor: colors.border,
  }

  const inputTextStyle: TextStyle = {
    flex: 1,
    fontSize: currentSize.fontSize,
    color: disabled ? colors.textDisabled : colors.text,
    fontFamily: typography.body.fontWeight,
  }

  const staticLabelStyle: TextStyle = {
    position: variant === "underlined" ? "relative" : "absolute",
    left: variant === "underlined" ? 0 : currentSize.paddingHorizontal,
    top: variant === "underlined" ? 0 : -8,
    fontSize: variant === "underlined" ? 14 : 12,
    color: colors.textSecondary,
    backgroundColor: variant === "outlined" ? colors.background : "transparent",
    paddingHorizontal: variant === "outlined" ? 4 : 0,
    zIndex: 1,
  }

  return (
    <View style={[containerStyle, style]}>
      {/* Label */}
      {label && !animateLabel && (
        <Text style={[staticLabelStyle, labelStyle]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <AnimatedView style={[inputContainerStyle, containerAnimatedStyle]}>
        {/* Left Icon */}
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={currentSize.iconSize}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={{ marginRight: spacing.sm }}
          />
        )}

        {/* Animated Label */}
        {label && animateLabel && variant !== "underlined" && (
          <Animated.Text
            style={[
              {
                position: "absolute",
                left: leftIcon
                  ? currentSize.paddingHorizontal + currentSize.iconSize + spacing.sm
                  : currentSize.paddingHorizontal,
                fontSize: currentSize.fontSize,
                color: colors.textSecondary,
              },
              labelAnimatedStyle,
              labelStyle,
            ]}
          >
            {label}
            {required && <Text style={{ color: colors.error }}> *</Text>}
          </Animated.Text>
        )}

        {/* Text Input */}
        <AnimatedTextInput
          ref={inputRef}
          style={[inputTextStyle, inputStyle]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled && !loading}
          maxLength={maxLength}
          placeholderTextColor={colors.textDisabled}
          {...textInputProps}
        />

        {/* Right Icon */}
        {(rightIcon || loading) && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress || loading}
            style={{ marginLeft: spacing.sm }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon
                name={rightIcon!}
                size={currentSize.iconSize}
                color={isFocused ? colors.primary : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        )}
      </AnimatedView>

      {/* Underline Animation */}
      {variant === "underlined" && (
        <AnimatedView
          style={[
            {
              height: 2,
              marginTop: 1,
              transformOrigin: "left",
            },
            underlineAnimatedStyle,
          ]}
        />
      )}

      {/* Error Message */}
      {hasError && (
        <Animated.Text
          style={[
            {
              fontSize: 12,
              color: colors.error,
              marginTop: spacing.xs,
            },
            errorStyle,
            errorAnimatedStyle,
          ]}
        >
          {error || internalError}
        </Animated.Text>
      )}

      {/* Helper Text */}
      {helperText && !hasError && (
        <Text
          style={[
            {
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            },
            helperStyle,
          ]}
        >
          {helperText}
        </Text>
      )}

      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <Text
          style={[
            {
              fontSize: 12,
              color: characterCount > maxLength * 0.8 ? colors.warning : colors.textSecondary,
              textAlign: "right",
              marginTop: spacing.xs,
            },
            helperStyle,
          ]}
        >
          {characterCount}/{maxLength}
        </Text>
      )}
    </View>
  )
}
