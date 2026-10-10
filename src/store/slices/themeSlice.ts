import { Appearance } from 'react-native'
import { MMKV } from 'react-native-mmkv'
import { z } from 'zod'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Init MMKV storage
const storage = new MMKV()

// Zod validation schemas
const ThemeModeSchema = z.enum(['light', 'dark', 'system'])
const ColorSchemeSchema = z.enum(['light', 'dark']).nullable()

type ThemeMode = z.infer<typeof ThemeModeSchema>
type ColorScheme = z.infer<typeof ColorSchemeSchema>

// Colors interface
interface Colors {
  primary: string
  primaryDark: string
  secondary: string
  accent: string
  background: string
  surface: string
  card: string
  text: string
  textSecondary: string
  border: string
  error: string
  warning: string
  success: string
  info: string
  white: string
  black: string
  shadow: string
  overlay: string
}

// Theme interface
interface Theme {
  isDark: boolean
  colors: Colors
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
    xl: number
  }
  shadows: {
    sm: object
    md: object
    lg: object
  }
  typography: {
    h1: object
    h2: object
    h3: object
    body: object
    caption: object
  }
}

// Light & dark color palettes
const lightColors: Colors = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  secondary: '#764ba2',
  accent: '#f093fb',
  background: '#ffffff',
  surface: '#f7fafc',
  card: '#ffffff',
  text: '#1a202c',
  textSecondary: '#718096',
  border: '#e2e8f0',
  error: '#e53e3e',
  warning: '#dd6b20',
  success: '#38a169',
  info: '#3182ce',
  white: '#ffffff',
  black: '#000000',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
}

const darkColors: Colors = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  secondary: '#764ba2',
  accent: '#f093fb',
  background: '#1a202c',
  surface: '#2d3748',
  card: '#2d3748',
  text: '#f7fafc',
  textSecondary: '#a0aec0',
  border: '#4a5568',
  error: '#fc8181',
  warning: '#f6ad55',
  success: '#68d391',
  info: '#63b3ed',
  white: '#ffffff',
  black: '#000000',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
}

// Theme factory
const createTheme = (isDark: boolean = true): Theme => ({
  isDark,
  colors: isDark ? darkColors : lightColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40, color: isDark ? darkColors.text : lightColors.text },
    h2: { fontSize: 24, fontWeight: '600', lineHeight: 32, color: isDark ? darkColors.text : lightColors.text },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, color: isDark ? darkColors.text : lightColors.text },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24, color: isDark ? darkColors.text : lightColors.text },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: isDark ? darkColors.textSecondary : lightColors.textSecondary,
    },
  },
})

// Store interface
interface ThemeState {
  themeMode: ThemeMode
  colorScheme: ColorScheme
  theme: Theme
  colors: Colors

  // Actions
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  setColorScheme: (scheme: ColorScheme) => void
}

// ✅ Zustand store
export const useThemeStore = create<ThemeState>()(
  persist(
    immer((set, get) => ({
      themeMode: 'dark',
      colorScheme: Appearance?.getColorScheme() ?? 'dark',
      theme: createTheme(Appearance.getColorScheme() === 'dark'),
      colors: Appearance.getColorScheme() === 'dark' ? darkColors : lightColors,

      setThemeMode: (mode: ThemeMode) => {
        try {
          const validMode = ThemeModeSchema.parse(mode)
          set((state) => {
            state.themeMode = validMode
            let isDark = false
            if (validMode === 'dark') isDark = true
            else if (validMode === 'light') isDark = false
            else isDark = state.colorScheme === 'dark'

            state.theme = createTheme(isDark)
            state.colors = isDark ? darkColors : lightColors
          })
        } catch (error) {
          console.error('Invalid theme mode:', error)
        }
      },

      toggleTheme: () => {
        const newMode = get().themeMode === 'dark' ? 'light' : 'dark'
        get().setThemeMode(newMode)
      },

      setColorScheme: (scheme: ColorScheme) => {
        try {
          const validScheme = ColorSchemeSchema.parse(scheme)
          set((state) => {
            state.colorScheme = validScheme
            if (state.themeMode === 'system') {
              const isDark = validScheme === 'dark'
              state.theme = createTheme(isDark)
              state.colors = isDark ? darkColors : lightColors
            }
          })
        } catch (error) {
          console.error('Invalid color scheme:', error)
        }
      },
    })),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getString(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: (name) => storage.delete(name),
      })),
      partialize: (state) => ({
        themeMode: state.themeMode,
      }),
    },
  ),
)

// Listen to system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { setColorScheme } = useThemeStore.getState()
  setColorScheme(colorScheme || 'dark')
})
