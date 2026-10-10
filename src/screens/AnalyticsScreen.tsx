'use client'

import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { hapticFeedback } from '@/utils/haptics'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

const { width } = Dimensions.get('window')

interface AnalyticsData {
  totalScans: number
  successfulScans: number
  failedScans: number
  averageAccuracy: number
  biometricTypes: {
    fingerprint: number
    face: number
    iris: number
    voice: number
  }
  weeklyData: Array<{
    day: string
    scans: number
  }>
}

interface AnalyticsScreenProps {
  navigation: any
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ navigation }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    averageAccuracy: 0,
    biometricTypes: {
      fingerprint: 0,
      face: 0,
      iris: 0,
      voice: 0,
    },
    weeklyData: [],
  })
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week')
  const [isLoading, setIsLoading] = useState(true)

  const { trackEvent } = useAnalytics()

  useEffect(() => {
    trackEvent('analytics_screen_opened')
    loadAnalyticsData()
  }, [selectedPeriod])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call - replace with actual analytics service
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockData: AnalyticsData = {
        totalScans: 1247,
        successfulScans: 1189,
        failedScans: 58,
        averageAccuracy: 95.3,
        biometricTypes: {
          fingerprint: 456,
          face: 389,
          iris: 234,
          voice: 168,
        },
        weeklyData: [
          { day: 'Mon', scans: 45 },
          { day: 'Tue', scans: 52 },
          { day: 'Wed', scans: 38 },
          { day: 'Thu', scans: 61 },
          { day: 'Fri', scans: 47 },
          { day: 'Sat', scans: 33 },
          { day: 'Sun', scans: 29 },
        ],
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <GlassCard style={styles.statCard}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </GlassCard>
  )

  const renderChart = () => {
    const maxScans = Math.max(...analyticsData.weeklyData.map((d) => d.scans))

    return (
      <GlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Scan Activity</Text>
        <View style={styles.chart}>
          {analyticsData.weeklyData.map((data, index) => (
            <View key={index} style={styles.chartBar}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (data.scans / maxScans) * 100,
                    backgroundColor: `rgba(255, 255, 255, ${0.3 + (data.scans / maxScans) * 0.7})`,
                  },
                ]}
              />
              <Text style={styles.barLabel}>{data.day}</Text>
              <Text style={styles.barValue}>{data.scans}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    )
  }

  const renderBiometricBreakdown = () => {
    const total = Object.values(analyticsData.biometricTypes).reduce((sum, val) => sum + val, 0)

    return (
      <GlassCard style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Biometric Types Usage</Text>
        <View style={styles.breakdown}>
          {Object.entries(analyticsData.biometricTypes).map(([type, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0
            const icons = {
              fingerprint: 'fingerprint',
              face: 'face',
              iris: 'visibility',
              voice: 'mic',
            }

            return (
              <View key={type} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Icon name={icons[type as keyof typeof icons]} size={20} color="#FFFFFF" />
                  <Text style={styles.breakdownType}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.breakdownValue}>
                  {count} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            )
          })}
        </View>
      </GlassCard>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              hapticFeedback('selection')
              navigation.goBack()
            }}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <TouchableOpacity style={styles.exportButton}>
            <Icon name="file-download" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.selectedPeriodButton]}
              onPress={() => {
                hapticFeedback('selection')
                setSelectedPeriod(period)
              }}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === period && styles.selectedPeriodButtonText]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
          <View style={styles.statsGrid}>
            {renderStatCard('Total Scans', analyticsData.totalScans.toLocaleString(), 'analytics', '#4CAF50')}
            {renderStatCard(
              'Success Rate',
              `${((analyticsData.successfulScans / analyticsData.totalScans) * 100).toFixed(1)}%`,
              'check-circle',
              '#2196F3',
            )}
            {renderStatCard('Failed Scans', analyticsData.failedScans.toLocaleString(), 'error', '#FF5722')}
            {renderStatCard('Avg Accuracy', `${analyticsData.averageAccuracy}%`, 'speed', '#FF9800')}
          </View>

          {/* Chart */}
          {renderChart()}

          {/* Biometric Breakdown */}
          {renderBiometricBreakdown()}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exportButton: {
    padding: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedPeriodButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  periodButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 2,
    padding: 16,
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartCard: {
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  breakdownCard: {
    padding: 20,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  breakdown: {
    gap: 16,
  },
  breakdownItem: {
    marginBottom: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownType: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  breakdownValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
})
