import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'

interface TaskModalProps {
  task?: any
  onClose: () => void
}

const TaskModal = ({ task, onClose }: TaskModalProps) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Заполнить форму если редактируем
  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      })
    }
  }, [task])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: tasksApi.getCategories,
  })
  const categories = categoriesData?.categories || []

  const createTask = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Введите название задачи'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const data = {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      due_date: form.due_date || undefined,
    }
    if (task) {
      updateTask.mutate({ id: task.id, data })
    } else {
      createTask.mutate(data)
    }
  }

  const loading = createTask.isPending || updateTask.isPending

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">
            {task ? 'Редактировать задачу' : 'Новая задача'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Название *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Введите название задачи"
              className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-teal-400 transition-colors ${errors.title ? 'border-red-500' : 'border-gray-700'}`}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Описание задачи (необязательно)"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-teal-400 transition-colors resize-none"
            />
          </div>

          {/* Priority + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Приоритет</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-teal-400 transition-colors"
              >
                <option value="high">🔴 Высокий</option>
                <option value="medium">🟡 Средний</option>
                <option value="low">🟢 Низкий</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Дедлайн</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-teal-400 transition-colors"
              />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Категории</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: any) => (
                  <span
                    key={cat.id}
                    className="text-xs px-3 py-1 rounded-full border border-gray-700 text-gray-300"
                    style={{ borderColor: cat.color + '44', color: cat.color }}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg py-2.5 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-gray-900 font-semibold rounded-lg py-2.5 transition-colors"
            >
              {loading ? 'Сохранение...' : task ? 'Сохранить' : 'Создать'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default TaskModal