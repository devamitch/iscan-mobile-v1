'use client'

import { NavigationContainer } from '@react-navigation/native'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type React from 'react'
import { useEffect, useState } from 'react'
import { AppState, LogBox, StatusBar, type AppStateStatus } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableScreens } from 'react-native-screens'

import { ErrorBoundary } from '@/components/ui/ErrorBoundary/ErrorBoundary'
import { initializeApp } from '@/config/initialization'
import { AppNavigator } from '@/navigation/AppNavigator'
import { linking } from '@/navigation/linking'
import { asyncStoragePersister, queryClient } from '@/store/queryClient'
import { useAuthStore } from '@/store/slices/authSlice'
import { useThemeStore } from '@/store/slices/themeSlice'
import { ThemeProvider } from '@/themes/ThemeProvider'

// Enable React Native Screens optimization
enableScreens(true)

// Ignore specific warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'MediaPipe initialization warning',
    'OpenCV native module warning',
    'TensorFlow Lite model loading',
    'AR engine initialization',
    'Socket.IO connection warning',
    'Lottie animation warning',
  ])
}

const Application: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const { isLoading: authLoading } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🚀 Initializing AEye Scan App...')

        // Initialize core app services
        await initializeApp()

        // Initialize MediaPipe models
        console.log('📱 Loading MediaPipe models...')
        // Models will be loaded by MediaPipeProvider

        // Set up crash reporting

        setIsInitialized(true)
        console.log('✅ App initialization completed')
      } catch (error) {
        console.error('❌ App initialization failed:', error)
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error')
      } finally {
        // Hide splash screen after initialization
      }
    }

    initialize()
  }, [])

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        queryClient.resumePausedMutations()
      } else if (nextAppState === 'background') {
        // queryClient.pauseMutations()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => subscription?.remove()
  }, [])

  // Show holographic loading screen during initialization
  // if (!isInitialized || authLoading) {
  //   return <HolographicLoader error={initError} />
  // }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: asyncStoragePersister,
              maxAge: 1000 * 60 * 60 * 24, // 24 hours
            }}
            onSuccess={() => {
              // Resume paused mutations after hydration
              queryClient.resumePausedMutations()
            }}
          >
            <ThemeProvider>
              <NavigationContainer linking={linking}>
                <StatusBar
                  barStyle={theme.isDark ? 'light-content' : 'dark-content'}
                  backgroundColor="transparent"
                  translucent
                />
                <AppNavigator />
              </NavigationContainer>
            </ThemeProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}

export default Application
