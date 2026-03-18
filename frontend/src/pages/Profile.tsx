import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '../api/users'
import { authApi } from '../api/auth'

const Profile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ name: '', timezone: 'UTC' })
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.getMe,
  })

  useEffect(() => {
    if (data?.profile) {
      setForm({
        name: data.profile.name || '',
        timezone: data.profile.timezone || 'UTC',
      })
    }
  }, [data])

  const updateProfile = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const uploadAvatar = useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate(form)
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatar.mutate(file)
  }

  const handleLogout = async () => {
    await authApi.logout()
    navigate('/login')
  }

  const profile = data?.profile

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
        >
          ← Назад
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Профиль</h2>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-gray-600">👤</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute bottom-0 right-0 w-8 h-8 bg-teal-400 hover:bg-teal-300 rounded-full flex items-center justify-center text-gray-900 transition-colors"
              >
                {uploadAvatar.isPending ? '...' : '📷'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Имя</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ваше имя"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Часовой пояс</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-teal-400 transition-colors"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Almaty">Asia/Almaty (UTC+5)</option>
                <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="w-full bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-gray-900 font-semibold rounded-lg py-2.5 transition-colors"
            >
              {saved ? '✓ Сохранено!' : updateProfile.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="w-full mt-4 bg-transparent border border-gray-700 hover:border-red-500 text-gray-400 hover:text-red-400 font-medium rounded-lg py-2.5 transition-colors"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile