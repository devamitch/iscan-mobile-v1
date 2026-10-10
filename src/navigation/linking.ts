import type { LinkingOptions } from "@react-navigation/native"

export const linking: LinkingOptions<any> = {
  prefixes: ["aeye-scan://", "https://aeye-scan.com"],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: "welcome",
          Login: "login",
          Register: "register",
          ForgotPassword: "forgot-password",
          BiometricSetup: "biometric-setup",
        },
      },
      Onboarding: {
        screens: {
          OnboardingSlides: "onboarding",
          Permissions: "permissions",
          BiometricOnboarding: "biometric-onboarding",
          NotificationPermission: "notification-permission",
        },
      },
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Home: "home",
              Scanner: "scanner",
              Chat: "chat",
              Analytics: "analytics",
              Profile: "profile",
            },
          },
        },
      },
    },
  },
}
