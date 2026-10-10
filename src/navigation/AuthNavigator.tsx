import type React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { LoginScreen } from "@/screens/LoginScreen"
import { RegisterScreen } from "@/screens/RegisterScreen"
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen"
import { BiometricSetupScreen } from "@/screens/BiometricSetupScreen"

const Stack = createNativeStackNavigator()

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </Stack.Navigator>
  )
}
