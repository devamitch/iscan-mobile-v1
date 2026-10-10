'use client'

import { useNavigation } from '@react-navigation/native'
import type React from 'react'
import { useState } from 'react'
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

import { Button } from '@/components/ui/Button/Button'
import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { HolographicScanner } from '@/components/ui/Scanner/HolographicScanner'
import { useTheme } from '@/themes/ThemeProvider'
import { HapticFeedback } from '@/utils/haptics'
const { width } = Dimensions.get('window')

type ScanType = 'face' | 'iris' | 'hand' | 'pose' | 'holistic'

interface ScanMode {
  id: ScanType
  title: string
  description: string
  icon: string
  color: string
}

export const ScannerScreen: React.FC = () => {
  const { colors, spacing } = useTheme()
  const navigation = useNavigation()
  const [selectedScanType, setSelectedScanType] = useState<ScanType>('face')
  const [isScanning, setIsScanning] = useState(false)

  const scanModes: ScanMode[] = [
    {
      id: 'face',
      title: 'Face Detection',
      description: 'Detect and analyze facial features',
      icon: 'happy',
      color: colors.primary,
    },
    {
      id: 'iris',
      title: 'Iris Recognition',
      description: 'High-precision iris scanning',
      icon: 'eye',
      color: colors.secondary,
    },
    {
      id: 'hand',
      title: 'Hand Tracking',
      description: 'Track hand gestures and movements',
      icon: 'hand-left',
      color: colors.accent,
    },
    {
      id: 'pose',
      title: 'Pose Estimation',
      description: 'Full body pose analysis',
      icon: 'body',
      color: colors.warning,
    },
    {
      id: 'holistic',
      title: 'Holistic Analysis',
      description: 'Complete biometric analysis',
      icon: 'scan',
      color: colors.success,
    },
  ]

  const handleScanComplete = (results: any) => {
    setIsScanning(false)
    HapticFeedback.success()

    Alert.alert('Scan Complete', `${selectedScanType} scan completed successfully!`, [
      {
        text: 'View Results',
        onPress: () => {
          // Navigate to results screen with data
          navigation.navigate(
            'ScanResults' as never,
            {
              type: selectedScanType,
              results,
            } as never,
          )
        },
      },
      { text: 'Scan Again', onPress: () => setIsScanning(true) },
    ])
  }

  const handleScanError = (error: string) => {
    setIsScanning(false)
    HapticFeedback.error()
    Alert.alert('Scan Error', error)
  }

  const startScan = () => {
    setIsScanning(true)
    HapticFeedback.impact()
  }

  const stopScan = () => {
    setIsScanning(false)
    HapticFeedback.impact()
  }

  const selectScanMode = (scanType: ScanType) => {
    if (!isScanning) {
      setSelectedScanType(scanType)
      HapticFeedback.selection()
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Biometric Scanner</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <HolographicScanner scanType={selectedScanType} onScanComplete={handleScanComplete} onError={handleScanError} />
      </View>

      {/* Scan Mode Selector */}
      <View style={styles.modeSelector}>
        <GlassCard style={styles.modeSelectorCard}>
          <Text style={[styles.modeSelectorTitle, { color: colors.text }]}>Scan Mode</Text>

          <View style={styles.modeGrid}>
            {scanModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => selectScanMode(mode.id)}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: selectedScanType === mode.id ? mode.color + '20' : 'transparent',
                    borderColor: selectedScanType === mode.id ? mode.color : colors.border + '40',
                  },
                ]}
                disabled={isScanning}
              >
                <Icon
                  name={mode.icon}
                  size={24}
                  color={selectedScanType === mode.id ? mode.color : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color: selectedScanType === mode.id ? mode.color : colors.textSecondary,
                    },
                  ]}
                >
                  {mode.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected mode description */}
          <View style={styles.modeDescription}>
            <Text style={[styles.modeDescriptionText, { color: colors.textSecondary }]}>
              {scanModes.find((mode) => mode.id === selectedScanType)?.description}
            </Text>
          </View>
        </GlassCard>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Button
          title={isScanning ? 'Stop Scan' : 'Start Scan'}
          onPress={isScanning ? stopScan : startScan}
          variant={isScanning ? 'outline' : 'gradient'}
          size="large"
          icon={isScanning ? 'stop' : 'scan'}
          style={styles.scanButton}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  modeSelector: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
  },
  modeSelectorCard: {
    padding: 16,
  },
  modeSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeButton: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  modeDescription: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeDescriptionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  scanButton: {
    width: '100%',
  },
})
