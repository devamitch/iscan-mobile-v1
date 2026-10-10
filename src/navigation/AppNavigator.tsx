import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type React from 'react'

import { CustomDrawerContent } from '@/components/ui/CustomDrawer/CustomDrawerContent'
import { LoadingScreen } from '@/screens/LoadingScreen'
import { useAuthStore } from '@/store/slices/authSlice'
import { useOnboardingStore } from '@/store/slices/onboardingSlice'
import { AuthNavigator } from './AuthNavigator'
import { MainTabNavigator } from './MainTabNavigator'

const Stack = createNativeStackNavigator()
const Drawer = createDrawerNavigator()

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  )
}

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuthStore()
  const { hasCompletedOnboarding } = useOnboardingStore()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      )}
    </Stack.Navigator>
  )
}
