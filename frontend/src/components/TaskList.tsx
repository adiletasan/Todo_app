import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { tasksApi } from '../api/tasks'

type Filter = 'all' | 'todo' | 'in_progress' | 'done'

const filters: { label: string; value: Filter }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'todo' },
  { label: 'В процессе', value: 'in_progress' },
  { label: 'Выполненные', value: 'done' },
]

const priorityColors: Record<string, string> = {
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
}

const priorityLabels: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  task_categories: any[]
}

const TaskList = ({ onEditTask }: { onEditTask: (task: Task) => void }) => {
  const [filter, setFilter] = useState<Filter>('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filter, sortBy, sortOrder],
    queryFn: () => tasksApi.getAll({
      status: filter === 'all' ? undefined : filter,
      sortBy,
      sortOrder,
    }),
  })

  useEffect(() => {
    if (data?.tasks) setLocalTasks(data.tasks)
  }, [data])

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const tasks = localTasks

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(tasks)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)
    setLocalTasks(items)
  }

  return (
    <div>
      {/* Filters + Sort */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-teal-400 text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="created_at">По дате</option>
            <option value="title">По алфавиту</option>
            <option value="priority">По приоритету</option>
            <option value="due_date">По дедлайну</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="desc">↓ Убыв.</option>
            <option value="asc">↑ Возр.</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Всего', value: data?.pagination?.total || 0, color: 'text-white' },
          { label: 'Активных', value: tasks.filter((t) => t.status === 'todo').length, color: 'text-yellow-400' },
          { label: 'Выполнено', value: tasks.filter((t) => t.status === 'done').length, color: 'text-teal-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Task list with DnD */}
      {isLoading ? (
        <div className="text-gray-500 text-center py-12">Загрузка...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Нет задач</p>
          <p className="text-gray-600 text-sm mt-1">Создайте первую задачу</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-gray-900 border rounded-xl p-4 flex items-start gap-4 transition-all ${
                          snapshot.isDragging
                            ? 'border-teal-400 shadow-lg shadow-teal-400/10'
                            : task.status === 'done'
                            ? 'border-gray-800 opacity-60'
                            : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0"
                        >
                          ⠿
                        </div>

                        {/* Checkbox */}
                        <button
                          onClick={() => updateStatus.mutate({
                            id: task.id,
                            status: task.status === 'done' ? 'todo' : 'done',
                          })}
                          className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                            task.status === 'done'
                              ? 'bg-teal-400 border-teal-400'
                              : 'border-gray-600 hover:border-teal-400'
                          }`}
                        >
                          {task.status === 'done' && (
                            <span className="text-gray-900 text-xs font-bold">✓</span>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-white font-medium ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-gray-500 text-sm mt-1 truncate">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-md border ${priorityColors[task.priority]}`}>
                              {priorityLabels[task.priority]}
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-gray-500">
                                📅 {new Date(task.due_date).toLocaleDateString('ru-RU')}
                              </span>
                            )}
                            {task.status === 'in_progress' && (
                              <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-md">
                                В процессе
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => onEditTask(task)}
                            className="text-gray-500 hover:text-white transition-colors text-sm px-2 py-1 rounded hover:bg-gray-800"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteTask.mutate(task.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded hover:bg-gray-800"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}

export default TaskList