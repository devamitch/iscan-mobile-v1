import React from 'react'
import { Platform } from 'react-native'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
}

export const hapticFeedback = (type: HapticType = 'light'): void => {
  if (Platform.OS === 'ios') {
    switch (type) {
      case 'light':
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions)
        break
      case 'medium':
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions)
        break
      case 'heavy':
        ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions)
        break
      case 'selection':
        ReactNativeHapticFeedback.trigger('selection', hapticOptions)
        break
      case 'success':
        ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions)
        break
      case 'warning':
        ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions)
        break
      case 'error':
        ReactNativeHapticFeedback.trigger('notificationError', hapticOptions)
        break
      default:
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions)
    }
  } else {
    // Android fallback
    switch (type) {
      case 'light':
        ReactNativeHapticFeedback.trigger('keyboardPress', hapticOptions)
        break
      case 'medium':
        ReactNativeHapticFeedback.trigger('keyboardTap', hapticOptions)
        break
      case 'heavy':
        ReactNativeHapticFeedback.trigger('longPress', hapticOptions)
        break
      case 'selection':
        ReactNativeHapticFeedback.trigger('keyboardPress', hapticOptions)
        break
      case 'success':
        ReactNativeHapticFeedback.trigger('effectDoubleClick', hapticOptions)
        break
      case 'warning':
        ReactNativeHapticFeedback.trigger('effectClick', hapticOptions)
        break
      case 'error':
        ReactNativeHapticFeedback.trigger('effectHeavyClick', hapticOptions)
        break
      default:
        ReactNativeHapticFeedback.trigger('keyboardPress', hapticOptions)
    }
  }
}

export const hapticPatterns = {
  heartbeat: () => {
    hapticFeedback('medium')
    setTimeout(() => hapticFeedback('light'), 100)
    setTimeout(() => hapticFeedback('medium'), 200)
  },

  notification: () => {
    hapticFeedback('light')
    setTimeout(() => hapticFeedback('medium'), 50)
    setTimeout(() => hapticFeedback('light'), 100)
  },

  success: () => {
    hapticFeedback('success')
  },

  error: () => {
    hapticFeedback('error')
  },

  warning: () => {
    hapticFeedback('warning')
  },
}

// HapticFeedback Component
interface HapticFeedbackProps {
  children: React.ReactNode
  type?: HapticType
  onPress?: () => void
  disabled?: boolean
}

export const HapticFeedback: React.FC<HapticFeedbackProps> = ({
  children,
  type = 'light',
  onPress,
  disabled = false,
}) => {
  const handlePress = () => {
    if (!disabled) {
      hapticFeedback(type)
      onPress?.()
    }
  }

  return React.cloneElement(children as React.ReactElement, {
    onPress: handlePress,
  })
}
