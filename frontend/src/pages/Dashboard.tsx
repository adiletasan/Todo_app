import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TaskList from '../components/TaskList'
import TaskModal from '../components/TaskModal'

const Dashboard = () => {
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<any>(null)

  const handleClose = () => {
    setShowModal(false)
    setEditTask(null)
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar onAddTask={() => setShowModal(true)} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Мои задачи</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-teal-400 hover:bg-teal-300 text-gray-900 font-semibold rounded-lg py-2 px-4 transition-colors"
            >
              + Добавить
            </button>
          </div>
          <TaskList onEditTask={(task) => {
            setEditTask(task)
            setShowModal(true)
          }} />
        </div>
      </main>

      {showModal && (
        <TaskModal task={editTask} onClose={handleClose} />
      )}
    </div>
  )
}

export default Dashboard