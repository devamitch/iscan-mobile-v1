import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type React from 'react'

import { CustomTabBar } from '@/components/ui/CustomTabBar/CustomTabBar'
import { AnalyticsScreen } from '@/screens/AnalyticsScreen'
import { ChatScreen } from '@/screens/ChatScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { ScannerScreen } from '@/screens/ScannerScreen'

const Tab = createBottomTabNavigator()

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scanner',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  )
}
