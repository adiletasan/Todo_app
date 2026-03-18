import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

const applyTheme = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark'
applyTheme(savedTheme)

export const useThemeStore = create<ThemeState>((set) => ({
  theme: savedTheme,

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    return { theme: newTheme }
  }),
}))