'use client'

import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useTheme } from '../../../themes/ThemeProvider'
import type { AccordionItem, AccordionProps } from '../../../types/components'
import { hapticFeedback } from '../../../utils/haptics'

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  animated = true,
  style,
  onItemPress,
}) => {
  const theme = useTheme()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    hapticFeedback('light')

    setExpandedItems((prev) => {
      const newSet = new Set(prev)

      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        if (!allowMultiple) {
          newSet.clear()
        }
        newSet.add(itemId)
      }

      return newSet
    })

    onItemPress?.(itemId)
  }

  const AccordionItem: React.FC<{ item: AccordionItem; isExpanded: boolean }> = ({ item, isExpanded }) => {
    const height = useSharedValue(0)
    const rotation = useSharedValue(0)
    const opacity = useSharedValue(0)

    React.useEffect(() => {
      if (animated) {
        height.value = withSpring(isExpanded ? 1 : 0, { damping: 15, stiffness: 100 })
        rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 300 })
        opacity.value = withTiming(isExpanded ? 1 : 0, { duration: 300 })
      } else {
        height.value = isExpanded ? 1 : 0
        rotation.value = isExpanded ? 180 : 0
        opacity.value = isExpanded ? 1 : 0
      }
    }, [isExpanded, animated])

    const contentAnimatedStyle = useAnimatedStyle(() => ({
      height: interpolate(height.value, [0, 1], [0, 200]),
      opacity: opacity.value,
    }))

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }))

    const tapGesture = Gesture.Tap()
      .enabled(!item.disabled)
      .onEnd(() => {
        runOnJS(toggleItem)(item.id)
      })

    const styles = StyleSheet.create({
      itemContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.medium,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: isExpanded ? theme.colors.primary + '10' : 'transparent',
      },
      headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
      },
      icon: {
        marginRight: theme.spacing.sm,
      },
      title: {
        fontSize: 16,
        fontWeight: '600',
        color: item.disabled ? theme.colors.textSecondary : theme.colors.text,
        flex: 1,
      },
      chevron: {
        marginLeft: theme.spacing.sm,
      },
      content: {
        overflow: 'hidden',
      },
      contentInner: {
        padding: theme.spacing.md,
        paddingTop: 0,
      },
      contentText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
      },
    })

    return (
      <View style={styles.itemContainer}>
        <GestureDetector gesture={tapGesture}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {item.icon && (
                <Icon
                  name={item.icon}
                  size={20}
                  color={item.disabled ? theme.colors.textSecondary : theme.colors.primary}
                  style={styles.icon}
                />
              )}
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <Animated.View style={[styles.chevron, iconAnimatedStyle]}>
              <Icon
                name="keyboard-arrow-down"
                size={24}
                color={item.disabled ? theme.colors.textSecondary : theme.colors.text}
              />
            </Animated.View>
          </View>
        </GestureDetector>

        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <View style={styles.contentInner}>
            {typeof item.content === 'string' ? <Text style={styles.contentText}>{item.content}</Text> : item.content}
          </View>
        </Animated.View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  })

  return (
    <View style={[styles.container, style]}>
      {items.map((item) => (
        <AccordionItem key={item.id} item={item} isExpanded={expandedItems.has(item.id)} />
      ))}
    </View>
  )
}
