'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.register(form.name, form.email, form.password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/workspace')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-violet-400 font-bold text-lg block mb-8">
          CollabNotes
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-gray-500 text-sm mb-8">Start collaborating in minutes</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              className="input"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              className="input"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Min 8 characters"
              className="input"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-gray-600 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
