import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { z } from "zod"
import { MMKV } from "react-native-mmkv"

const storage = new MMKV()

// Zod schemas for validation
const OnboardingStepSchema = z.enum(["welcome", "permissions", "biometric", "notifications", "completed"])

type OnboardingStep = z.infer<typeof OnboardingStepSchema>

interface OnboardingState {
  hasCompletedOnboarding: boolean
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  skippedSteps: OnboardingStep[]

  // Actions
  setCurrentStep: (step: OnboardingStep) => void
  completeStep: (step: OnboardingStep) => void
  skipStep: (step: OnboardingStep) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    immer((set, get) => ({
      hasCompletedOnboarding: false,
      currentStep: "welcome",
      completedSteps: [],
      skippedSteps: [],

      setCurrentStep: (step: OnboardingStep) => {
        try {
          const validStep = OnboardingStepSchema.parse(step)

          set((state) => {
            state.currentStep = validStep
          })
        } catch (error) {
          console.error("Invalid onboarding step:", error)
        }
      },

      completeStep: (step: OnboardingStep) => {
        try {
          const validStep = OnboardingStepSchema.parse(step)

          set((state) => {
            if (!state.completedSteps.includes(validStep)) {
              state.completedSteps.push(validStep)
            }

            // Remove from skipped if it was there
            state.skippedSteps = state.skippedSteps.filter((s) => s !== validStep)
          })
        } catch (error) {
          console.error("Invalid onboarding step:", error)
        }
      },

      skipStep: (step: OnboardingStep) => {
        try {
          const validStep = OnboardingStepSchema.parse(step)

          set((state) => {
            if (!state.skippedSteps.includes(validStep)) {
              state.skippedSteps.push(validStep)
            }

            // Remove from completed if it was there
            state.completedSteps = state.completedSteps.filter((s) => s !== validStep)
          })
        } catch (error) {
          console.error("Invalid onboarding step:", error)
        }
      },

      completeOnboarding: () => {
        set((state) => {
          state.hasCompletedOnboarding = true
          state.currentStep = "completed"
        })
      },

      resetOnboarding: () => {
        set((state) => {
          state.hasCompletedOnboarding = false
          state.currentStep = "welcome"
          state.completedSteps = []
          state.skippedSteps = []
        })
      },
    })),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getString(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: (name) => storage.delete(name),
      })),
    },
  ),
)
