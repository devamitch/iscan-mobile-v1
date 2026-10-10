import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { z } from "zod"
import auth from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { appleAuth } from "@invertase/react-native-apple-authentication"
import { MMKV } from "react-native-mmkv"

import { BiometricService } from "@/services/biometric/BiometricService"
import { AnalyticsService } from "@/services/analytics/AnalyticsService"

const storage = new MMKV()

// Zod schemas for validation
const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  emailVerified: z.boolean(),
  isAnonymous: z.boolean(),
  metadata: z.object({
    creationTime: z.string().optional(),
    lastSignInTime: z.string().optional(),
  }),
  providerData: z.array(z.any()),
})

const LoginCredentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const RegisterCredentialsSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type User = z.infer<typeof UserSchema>
type LoginCredentials = z.infer<typeof LoginCredentialsSchema>
type RegisterCredentials = z.infer<typeof RegisterCredentialsSchema>

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  biometricEnabled: boolean
  lastLoginMethod: "email" | "google" | "apple" | "biometric" | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  loginWithBiometric: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  enableBiometric: () => Promise<void>
  disableBiometric: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      biometricEnabled: false,
      lastLoginMethod: null,

      login: async (email: string, password: string) => {
        try {
          set((state) => {
            state.isLoading = true
          })

          // Validate credentials
          const credentials = LoginCredentialsSchema.parse({ email, password })

          const userCredential = await auth().signInWithEmailAndPassword(credentials.email, credentials.password)

          const user = UserSchema.parse({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            phoneNumber: userCredential.user.phoneNumber,
            emailVerified: userCredential.user.emailVerified,
            isAnonymous: userCredential.user.isAnonymous,
            metadata: {
              creationTime: userCredential.user.metadata.creationTime,
              lastSignInTime: userCredential.user.metadata.lastSignInTime,
            },
            providerData: userCredential.user.providerData,
          })

          set((state) => {
            state.user = user
            state.isAuthenticated = true
            state.lastLoginMethod = "email"
            state.isLoading = false
          })

          // Track login event
          AnalyticsService.track("user_login", {
            method: "email",
            user_id: user.uid,
          })
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set((state) => {
            state.isLoading = true
          })

          // Validate credentials
          const validatedCredentials = RegisterCredentialsSchema.parse(credentials)

          const userCredential = await auth().createUserWithEmailAndPassword(
            validatedCredentials.email,
            validatedCredentials.password,
          )

          // Update profile with name
          await userCredential.user.updateProfile({
            displayName: `${validatedCredentials.firstName} ${validatedCredentials.lastName}`,
          })

          const user = UserSchema.parse({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            phoneNumber: userCredential.user.phoneNumber,
            emailVerified: userCredential.user.emailVerified,
            isAnonymous: userCredential.user.isAnonymous,
            metadata: {
              creationTime: userCredential.user.metadata.creationTime,
              lastSignInTime: userCredential.user.metadata.lastSignInTime,
            },
            providerData: userCredential.user.providerData,
          })

          set((state) => {
            state.user = user
            state.isAuthenticated = true
            state.lastLoginMethod = "email"
            state.isLoading = false
          })

          // Track registration event
          AnalyticsService.track("user_register", {
            method: "email",
            user_id: user.uid,
          })
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      loginWithGoogle: async () => {
        try {
          set((state) => {
            state.isLoading = true
          })

          // Check if your device supports Google Play
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

          // Get the users ID token
          const { idToken } = await GoogleSignin.signIn()

          // Create a Google credential with the token
          const googleCredential = auth.GoogleAuthProvider.credential(idToken)

          // Sign-in the user with the credential
          const userCredential = await auth().signInWithCredential(googleCredential)

          const user = UserSchema.parse({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            phoneNumber: userCredential.user.phoneNumber,
            emailVerified: userCredential.user.emailVerified,
            isAnonymous: userCredential.user.isAnonymous,
            metadata: {
              creationTime: userCredential.user.metadata.creationTime,
              lastSignInTime: userCredential.user.metadata.lastSignInTime,
            },
            providerData: userCredential.user.providerData,
          })

          set((state) => {
            state.user = user
            state.isAuthenticated = true
            state.lastLoginMethod = "google"
            state.isLoading = false
          })

          AnalyticsService.track("user_login", {
            method: "google",
            user_id: user.uid,
          })
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      loginWithApple: async () => {
        try {
          set((state) => {
            state.isLoading = true
          })

          // Start the sign-in request
          const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
          })

          // Ensure Apple returned a user identityToken
          if (!appleAuthRequestResponse.identityToken) {
            throw new Error("Apple Sign-In failed - no identify token returned")
          }

          // Create a Firebase credential from the response
          const { identityToken, nonce } = appleAuthRequestResponse
          const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce)

          // Sign the user in with the credential
          const userCredential = await auth().signInWithCredential(appleCredential)

          const user = UserSchema.parse({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            phoneNumber: userCredential.user.phoneNumber,
            emailVerified: userCredential.user.emailVerified,
            isAnonymous: userCredential.user.isAnonymous,
            metadata: {
              creationTime: userCredential.user.metadata.creationTime,
              lastSignInTime: userCredential.user.metadata.lastSignInTime,
            },
            providerData: userCredential.user.providerData,
          })

          set((state) => {
            state.user = user
            state.isAuthenticated = true
            state.lastLoginMethod = "apple"
            state.isLoading = false
          })

          AnalyticsService.track("user_login", {
            method: "apple",
            user_id: user.uid,
          })
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      loginWithBiometric: async () => {
        try {
          set((state) => {
            state.isLoading = true
          })

          const { biometricEnabled } = get()
          if (!biometricEnabled) {
            throw new Error("Biometric authentication is not enabled")
          }

          const isAvailable = await BiometricService.isAvailable()
          if (!isAvailable) {
            throw new Error("Biometric authentication is not available")
          }

          const result = await BiometricService.authenticate("Please authenticate to sign in")
          if (!result.success) {
            throw new Error(result.error || "Biometric authentication failed")
          }

          // Get stored credentials
          const storedCredentials = storage.getString("biometric_credentials")
          if (!storedCredentials) {
            throw new Error("No stored credentials found")
          }

          const { email, password } = JSON.parse(storedCredentials)
          await get().login(email, password)

          set((state) => {
            state.lastLoginMethod = "biometric"
          })

          AnalyticsService.track("user_login", {
            method: "biometric",
            user_id: get().user?.uid,
          })
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      logout: async () => {
        try {
          set((state) => {
            state.isLoading = true
          })

          await auth().signOut()
          await GoogleSignin.signOut()

          set((state) => {
            state.user = null
            state.isAuthenticated = false
            state.lastLoginMethod = null
            state.isLoading = false
          })

          AnalyticsService.track("user_logout")
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      resetPassword: async (email: string) => {
        try {
          const validEmail = z.string().email().parse(email)
          await auth().sendPasswordResetEmail(validEmail)

          AnalyticsService.track("password_reset_requested", {
            email: validEmail,
          })
        } catch (error) {
          throw error
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set((state) => {
            state.isLoading = true
          })

          const currentUser = auth().currentUser
          if (!currentUser) {
            throw new Error("No authenticated user")
          }

          await currentUser.updateProfile({
            displayName: data.displayName,
            photoURL: data.photoURL,
          })

          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...data }
            }
            state.isLoading = false
          })

          AnalyticsService.track("profile_updated", {
            user_id: currentUser.uid,
          })
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      enableBiometric: async () => {
        try {
          const isAvailable = await BiometricService.isAvailable()
          if (!isAvailable) {
            throw new Error("Biometric authentication is not available")
          }

          const result = await BiometricService.authenticate("Please authenticate to enable biometric login")
          if (!result.success) {
            throw new Error(result.error || "Biometric authentication failed")
          }

          set((state) => {
            state.biometricEnabled = true
          })

          AnalyticsService.track("biometric_enabled", {
            user_id: get().user?.uid,
          })
        } catch (error) {
          throw error
        }
      },

      disableBiometric: async () => {
        try {
          storage.delete("biometric_credentials")

          set((state) => {
            state.biometricEnabled = false
          })

          AnalyticsService.track("biometric_disabled", {
            user_id: get().user?.uid,
          })
        } catch (error) {
          throw error
        }
      },

      refreshUser: async () => {
        try {
          const currentUser = auth().currentUser
          if (!currentUser) {
            return
          }

          await currentUser.reload()
          const refreshedUser = auth().currentUser

          if (refreshedUser) {
            const user = UserSchema.parse({
              uid: refreshedUser.uid,
              email: refreshedUser.email,
              displayName: refreshedUser.displayName,
              photoURL: refreshedUser.photoURL,
              phoneNumber: refreshedUser.phoneNumber,
              emailVerified: refreshedUser.emailVerified,
              isAnonymous: refreshedUser.isAnonymous,
              metadata: {
                creationTime: refreshedUser.metadata.creationTime,
                lastSignInTime: refreshedUser.metadata.lastSignInTime,
              },
              providerData: refreshedUser.providerData,
            })

            set((state) => {
              state.user = user
            })
          }
        } catch (error) {
          console.error("Failed to refresh user:", error)
        }
      },
    })),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getString(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: (name) => storage.delete(name),
      })),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        biometricEnabled: state.biometricEnabled,
        lastLoginMethod: state.lastLoginMethod,
      }),
    },
  ),
)

// Initialize auth state listener
auth().onAuthStateChanged((user) => {
  const { refreshUser } = useAuthStore.getState()
  if (user) {
    refreshUser()
  } else {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      lastLoginMethod: null,
    })
  }
})
