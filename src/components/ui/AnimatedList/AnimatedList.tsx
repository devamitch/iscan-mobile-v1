'use client'

import React, { useCallback, useMemo } from 'react'
import { FlatList, RefreshControl, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { useTheme } from '../../../themes/ThemeProvider'

interface AnimatedListProps<T> {
  data: T[]
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement
  keyExtractor: (item: T, index: number) => string
  onRefresh?: () => void
  refreshing?: boolean
  onEndReached?: () => void
  onEndReachedThreshold?: number
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement
  ItemSeparatorComponent?: React.ComponentType<any> | React.ReactElement
  numColumns?: number
  horizontal?: boolean
  showsVerticalScrollIndicator?: boolean
  showsHorizontalScrollIndicator?: boolean
  contentContainerStyle?: any
  style?: any
  animationType?: 'fade' | 'slide' | 'scale' | 'bounce'
  staggerDelay?: number
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export function AnimatedList<T>({
  data,
  renderItem,
  keyExtractor,
  onRefresh,
  refreshing = false,
  onEndReached,
  onEndReachedThreshold = 0.1,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  numColumns = 1,
  horizontal = false,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = true,
  contentContainerStyle,
  style,
  animationType = 'fade',
  staggerDelay = 100,
}: AnimatedListProps<T>) {
  const theme = useTheme()

  const AnimatedListItem: React.FC<{ item: T; index: number }> = ({ item, index }) => {
    const opacity = useSharedValue(0)
    const translateY = useSharedValue(50)
    const scale = useSharedValue(0.8)

    React.useEffect(() => {
      const delay = index * staggerDelay

      switch (animationType) {
        case 'fade':
          opacity.value = withDelay(delay, withTiming(1, { duration: 500 }))
          break
        case 'slide':
          opacity.value = withDelay(delay, withTiming(1, { duration: 500 }))
          translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }))
          break
        case 'scale':
          opacity.value = withDelay(delay, withTiming(1, { duration: 500 }))
          scale.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 100 }))
          break
        case 'bounce':
          opacity.value = withDelay(delay, withTiming(1, { duration: 300 }))
          scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 150 }))
          break
      }
    }, [index])

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }))

    return <Animated.View style={animatedStyle}>{renderItem({ item, index })}</Animated.View>
  }

  const renderAnimatedItem = useCallback(
    ({ item, index }: { item: T; index: number }) => <AnimatedListItem item={item} index={index} />,
    [renderItem, animationType, staggerDelay],
  )

  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      ) : undefined,
    [onRefresh, refreshing, theme.colors.primary],
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
      paddingVertical: theme.spacing.sm,
    },
  })

  return (
    <AnimatedFlatList
      data={data}
      renderItem={renderAnimatedItem}
      keyExtractor={keyExtractor}
      refreshControl={refreshControl}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      numColumns={numColumns}
      horizontal={horizontal}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      style={[styles.container, style]}
    />
  )
}
