'use client'

import type React from 'react'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native'
import { PanGestureHandler, type PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../../../themes/ThemeProvider'
import { hapticFeedback } from '../../../utils/haptics'

const { height: screenHeight } = Dimensions.get('window')

interface BottomSheetProps {
  children: React.ReactNode
  snapPoints?: number[]
  initialSnapPoint?: number
  onClose?: () => void
  onSnapPointChange?: (index: number) => void
  backdropOpacity?: number
  enablePanDownToClose?: boolean
  enableBackdropDismiss?: boolean
  style?: any
}

export interface BottomSheetRef {
  snapTo: (index: number) => void
  close: () => void
  expand: () => void
  collapse: () => void
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      snapPoints = [0.25, 0.5, 0.9],
      initialSnapPoint = 0,
      onClose,
      onSnapPointChange,
      backdropOpacity = 0.5,
      enablePanDownToClose = true,
      enableBackdropDismiss = true,
      style,
    },
    ref,
  ) => {
    const theme = useTheme()
    const translateY = useSharedValue(screenHeight)
    const backdropOpacityValue = useSharedValue(0)
    const currentSnapIndex = useSharedValue(initialSnapPoint)

    const snapPointsInPixels = snapPoints.map((point) => screenHeight * (1 - point))

    useEffect(() => {
      // Initial animation
      translateY.value = withSpring(snapPointsInPixels[initialSnapPoint], { damping: 15, stiffness: 100 })
      backdropOpacityValue.value = withTiming(backdropOpacity, { duration: 300 })
    }, [])

    const snapTo = (index: number) => {
      if (index >= 0 && index < snapPoints.length) {
        translateY.value = withSpring(snapPointsInPixels[index], { damping: 15, stiffness: 100 })
        currentSnapIndex.value = index
        onSnapPointChange?.(index)
        hapticFeedback('light')
      }
    }

    const close = () => {
      translateY.value = withTiming(screenHeight, { duration: 300 })
      backdropOpacityValue.value = withTiming(0, { duration: 300 })
      setTimeout(() => onClose?.(), 300)
      hapticFeedback('medium')
    }

    const expand = () => snapTo(snapPoints.length - 1)
    const collapse = () => snapTo(0)

    useImperativeHandle(ref, () => ({
      snapTo,
      close,
      expand,
      collapse,
    }))

    const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        runOnJS(hapticFeedback)('light')
      },
      onActive: (event) => {
        const newTranslateY = snapPointsInPixels[currentSnapIndex.value] + event.translationY

        if (newTranslateY >= snapPointsInPixels[snapPoints.length - 1]) {
          translateY.value = newTranslateY
        }
      },
      onEnd: (event) => {
        const currentY = snapPointsInPixels[currentSnapIndex.value] + event.translationY
        const velocity = event.velocityY

        // Find closest snap point
        let closestSnapIndex = 0
        let minDistance = Math.abs(currentY - snapPointsInPixels[0])

        snapPointsInPixels.forEach((snapPoint, index) => {
          const distance = Math.abs(currentY - snapPoint)
          if (distance < minDistance) {
            minDistance = distance
            closestSnapIndex = index
          }
        })

        // Consider velocity for snap decision
        if (velocity > 500 && closestSnapIndex > 0) {
          closestSnapIndex = Math.max(0, closestSnapIndex - 1)
        } else if (velocity < -500 && closestSnapIndex < snapPoints.length - 1) {
          closestSnapIndex = Math.min(snapPoints.length - 1, closestSnapIndex + 1)
        }

        // Close if dragged down too far
        if (enablePanDownToClose && currentY > screenHeight * 0.8) {
          runOnJS(close)()
          return
        }

        runOnJS(snapTo)(closestSnapIndex)
      },
    })

    const sheetAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }))

    const backdropAnimatedStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacityValue.value,
    }))

    const handleBackdropPress = () => {
      if (enableBackdropDismiss) {
        close()
      }
    }

    const styles = StyleSheet.create({
      container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
      },
      backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
      },
      sheet: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: screenHeight,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.large,
        borderTopRightRadius: theme.borderRadius.large,
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
      handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
      },
      content: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
      },
    })

    return (
      <View style={styles.container} pointerEvents="box-none">
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </TouchableOpacity>

        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.sheet, sheetAnimatedStyle, style]}>
            <View style={styles.handle} />
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    )
  },
)

BottomSheet.displayName = 'BottomSheet'
