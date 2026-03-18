import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import { authApi } from '../api/auth'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  onAddTask: () => void
}

const Sidebar = ({ onAddTask }: SidebarProps) => {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: tasksApi.getCategories,
  })

  const categories = data?.categories || []

  const handleLogout = async () => {
    setLoggingOut(true)
    await authApi.logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">

      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">
          Todo <span className="text-teal-400">App</span>
        </h1>
      </div>

      {/* Add Task Button */}
      <div className="p-4">
        <button
          onClick={onAddTask}
          className="w-full bg-teal-400 hover:bg-teal-300 text-gray-900 font-semibold rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition-colors"
        >
          <span className="text-lg font-bold">+</span>
          Добавить задачу
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-2 py-2">Задачи</p>
        <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2">
          <span>📋</span> Все задачи
        </button>
        <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2">
          <span>🔵</span> В процессе
        </button>
        <button className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2">
          <span>✅</span> Выполненные
        </button>
      </nav>

      {/* Categories */}
      <div className="px-4 mt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-2 py-2">Категории</p>
        {categories.length === 0 ? (
          <p className="text-gray-600 text-sm px-2">Нет категорий</p>
        ) : (
          <div className="space-y-1">
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="mt-auto p-4 border-t border-gray-800 space-y-1">
        <ThemeToggle />
        <Link
          to="/profile"
          className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
        >
          <span>👤</span> Профиль
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-red-400 transition-colors flex items-center gap-2"
        >
          <span>🚪</span> {loggingOut ? 'Выход...' : 'Выйти'}
        </button>
      </div>

    </aside>
  )
}

export default Sidebar