'use client'

import React, { useRef, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useTheme } from '../../../themes/ThemeProvider'
import { hapticFeedback } from '../../../utils/haptics'

const { width: screenWidth } = Dimensions.get('window')

interface CarouselProps<T> {
  data: T[]
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement
  itemWidth?: number
  spacing?: number
  showPagination?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  onIndexChange?: (index: number) => void
  style?: any
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export function Carousel<T>({
  data,
  renderItem,
  itemWidth = screenWidth - 40,
  spacing = 20,
  showPagination = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  onIndexChange,
  style,
}: CarouselProps<T>) {
  const theme = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollX = useSharedValue(0)
  const autoPlayRef = useRef<NodeJS.Timeout>()

  const totalItemWidth = itemWidth + spacing

  React.useEffect(() => {
    if (autoPlay && data.length > 1) {
      autoPlayRef.current = setInterval(() => {
        const nextIndex = (currentIndex + 1) % data.length
        scrollToIndex(nextIndex)
      }, autoPlayInterval)

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current)
        }
      }
    }
  }, [autoPlay, currentIndex, data.length, autoPlayInterval])

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * totalItemWidth,
        animated: true,
      })
    }
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / totalItemWidth)
      if (index !== currentIndex) {
        setCurrentIndex(index)
        onIndexChange?.(index)
      }
    },
  })

  const PaginationDot: React.FC<{ index: number }> = ({ index }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const inputRange = [(index - 1) * totalItemWidth, index * totalItemWidth, (index + 1) * totalItemWidth]

      const scale = interpolate(scrollX.value, inputRange, [0.8, 1.2, 0.8], 'clamp')
      const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], 'clamp')

      return {
        transform: [{ scale }],
        opacity,
      }
    })

    return (
      <TouchableOpacity
        onPress={() => {
          hapticFeedback('light')
          scrollToIndex(index)
        }}
      >
        <Animated.View
          style={[
            {
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.colors.primary,
              marginHorizontal: 4,
            },
            animatedStyle,
          ]}
        />
      </TouchableOpacity>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flexGrow: 0,
    },
    contentContainer: {
      paddingHorizontal: spacing / 2,
    },
    itemContainer: {
      width: itemWidth,
      marginHorizontal: spacing / 2,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
  })

  return (
    <View style={[styles.container, style]}>
      <AnimatedScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={totalItemWidth}
        snapToAlignment="start"
        contentContainerStyle={styles.contentContainer}
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {data.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            {renderItem({ item, index })}
          </View>
        ))}
      </AnimatedScrollView>

      {showPagination && data.length > 1 && (
        <View style={styles.pagination}>
          {data.map((_, index) => (
            <PaginationDot key={index} index={index} />
          ))}
        </View>
      )}
    </View>
  )
}
