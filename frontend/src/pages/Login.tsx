import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/auth.store'

interface FormData {
  email: string
  password: string
}

interface Errors {
  email?: string
  password?: string
  general?: string
}

const Login = () => {
  const navigate = useNavigate()
  const { setToken } = useAuthStore()
  const [form, setForm] = useState<FormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    const e: Errors = {}
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Неверный формат email'
    if (!form.password) e.password = 'Введите пароль'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validate()) return
  setLoading(true)
  try {
    const data = await authApi.login(form.email, form.password)
    setToken(data.accessToken)
    navigate('/dashboard')
  } catch (err: any) {
    setErrors({ general: err.response?.data?.message || 'Неверный email или пароль' })
  } finally {
    setLoading(false)
  }
}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Todo <span className="text-teal-400">App</span></h1>
          <p className="text-gray-400 mt-2">Войдите в аккаунт</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-6 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ivan@example.com"
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-teal-400 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm text-gray-400">Пароль</label>
                <Link to="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300">
                  Забыл пароль?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Введите пароль"
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-teal-400 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-700'}`}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-400 hover:bg-teal-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-lg py-3 transition-colors"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>

          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300">
              Зарегистрироваться
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login