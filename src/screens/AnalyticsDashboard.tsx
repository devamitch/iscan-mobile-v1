'use client'

import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LineChart, PieChart } from 'react-native-chart-kit'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import Icon from 'react-native-vector-icons/Ionicons'

import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { HolographicView } from '@/components/ui/HolographicView/HolographicView'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTheme } from '@/themes/ThemeProvider'

const { width, height } = Dimensions.get('window')

interface AnalyticsData {
  scanHistory: Array<{
    date: string
    type: string
    accuracy: number
    duration: number
  }>
  biometricStats: {
    faceScans: number
    irisScans: number
    handScans: number
    poseAnalysis: number
  }
  accuracyTrends: Array<{
    date: string
    accuracy: number
  }>
  deviceMetrics: {
    cpuUsage: number
    memoryUsage: number
    batteryLevel: number
    temperature: number
  }
}

export const AnalyticsDashboard: React.FC = () => {
  const { colors } = useTheme()
  const { getAnalyticsData } = useAnalytics()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week')

  // Animations
  const cardScale = useSharedValue(0.9)
  const chartOpacity = useSharedValue(0)

  useEffect(() => {
    loadAnalyticsData()

    // Animate cards on mount
    cardScale.value = withSpring(1, { damping: 15 })
    chartOpacity.value = withTiming(1, { duration: 1000 })
  }, [selectedTimeRange])

  const loadAnalyticsData = async () => {
    try {
      const data = await getAnalyticsData(selectedTimeRange)
      setAnalyticsData(data)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    }
  }

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }))

  const chartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
  }))

  if (!analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <HolographicView style={styles.loadingCard}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading Analytics...</Text>
        </HolographicView>
      </View>
    )
  }

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: colors.primary + '20',
    backgroundGradientTo: colors.secondary + '20',
    decimalPlaces: 1,
    color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => colors.text + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border + '40',
    },
  }

  const biometricData = [
    {
      name: 'Face',
      population: analyticsData.biometricStats.faceScans,
      color: colors.primary,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Iris',
      population: analyticsData.biometricStats.irisScans,
      color: colors.secondary,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Hand',
      population: analyticsData.biometricStats.handScans,
      color: colors.accent,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Pose',
      population: analyticsData.biometricStats.poseAnalysis,
      color: colors.warning,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ]

  const accuracyData = {
    labels: analyticsData.accuracyTrends.map((item) =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ),
    datasets: [
      {
        data: analyticsData.accuracyTrends.map((item) => item.accuracy),
        color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16),
        strokeWidth: 3,
      },
    ],
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={[colors.primary + '20', colors.secondary + '20']} style={styles.header}>
        <BlurView style={styles.headerContent} blurType="dark" blurAmount={20}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Biometric Scan Insights</Text>
        </BlurView>
      </LinearGradient>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(['day', 'week', 'month'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              {
                backgroundColor: selectedTimeRange === range ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => setSelectedTimeRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                {
                  color: selectedTimeRange === range ? colors.background : colors.text,
                },
              ]}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <Animated.View style={[styles.statsContainer, cardAnimatedStyle]}>
        <GlassCard style={styles.statCard}>
          <Icon name="scan" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{analyticsData.scanHistory.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Scans</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <Icon name="checkmark-circle" size={32} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {(
              analyticsData.accuracyTrends.reduce((acc, item) => acc + item.accuracy, 0) /
              analyticsData.accuracyTrends.length
            ).toFixed(1)}
            %
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Accuracy</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <Icon name="time" size={32} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {(
              analyticsData.scanHistory.reduce((acc, item) => acc + item.duration, 0) /
              analyticsData.scanHistory.length /
              1000
            ).toFixed(1)}
            s
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Duration</Text>
        </GlassCard>
      </Animated.View>

      {/* Accuracy Trend Chart */}
      <Animated.View style={chartAnimatedStyle}>
        <GlassCard style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Accuracy Trends</Text>
          <LineChart
            data={accuracyData}
            width={width - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </GlassCard>
      </Animated.View>

      {/* Biometric Distribution */}
      <Animated.View style={chartAnimatedStyle}>
        <GlassCard style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Scan Distribution</Text>
          <PieChart
            data={biometricData}
            width={width - 60}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            absolute
          />
        </GlassCard>
      </Animated.View>

      {/* Device Metrics */}
      <GlassCard style={styles.metricsCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Device Performance</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Icon name="hardware-chip" size={24} color={colors.primary} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>CPU Usage</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{analyticsData.deviceMetrics.cpuUsage}%</Text>
          </View>

          <View style={styles.metricItem}>
            <Icon name="server" size={24} color={colors.secondary} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Memory</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{analyticsData.deviceMetrics.memoryUsage}%</Text>
          </View>

          <View style={styles.metricItem}>
            <Icon name="battery-half" size={24} color={colors.success} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Battery</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {analyticsData.deviceMetrics.batteryLevel}%
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Icon name="thermometer" size={24} color={colors.warning} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Temperature</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {analyticsData.deviceMetrics.temperature}°C
            </Text>
          </View>
        </View>
      </GlassCard>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 40,
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    height: 120,
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartCard: {
    margin: 20,
    marginBottom: 10,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  metricsCard: {
    margin: 20,
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
})
