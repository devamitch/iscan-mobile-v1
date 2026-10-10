"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { StatusBar } from "react-native"

import { useThemeStore } from "@/store/slices/themeSlice"
import { lightTheme, darkTheme, type Theme } from "./theme"

interface ThemeContextType {
  theme: Theme
  colors: Theme["colors"]
  spacing: Theme["spacing"]
  typography: Theme["typography"]
  shadows: Theme["shadows"]
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode, toggleTheme } = useThemeStore()
  const theme = isDarkMode ? darkTheme : lightTheme

  const value: ThemeContextType = {
    theme,
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    shadows: theme.shadows,
    isDarkMode,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
