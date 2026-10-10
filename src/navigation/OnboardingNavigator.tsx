import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type React from 'react'
import { Text, View } from 'react-native'

const Stack = createNativeStackNavigator()

export const OnboardingNavigator: React.FC = () => {
  return (
    <View>
      <Text>Onboarding Screens will go here</Text>
    </View>
  )
}
