import { useThemeStore } from '../store/theme.store'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
      {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    </button>
  )
}

export default ThemeToggle