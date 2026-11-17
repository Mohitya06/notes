'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiPlus, FiLogOut } from 'react-icons/fi'
import { workspacesApi } from '@/lib/api'
import { Workspace } from '@/types'

export default function WorkspacesPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login')
      return
    }
    workspacesApi.list().then(({ data }) => {
      setWorkspaces(data)
      setLoading(false)
    })
  }, [])

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const { data } = await workspacesApi.create(newName.trim())
    setWorkspaces((prev) => [data, ...prev])
    setNewName('')
    setCreating(false)
  }

  const logout = () => {
    localStorage.clear()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-white">Your Workspaces</h1>
          <div className="flex gap-3">
            <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
              <FiPlus size={15} /> New Workspace
            </button>
            <button onClick={logout} className="btn-ghost flex items-center gap-2">
              <FiLogOut size={15} /> Log out
            </button>
          </div>
        </div>

        {creating && (
          <form onSubmit={createWorkspace} className="card mb-6 flex gap-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name..."
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost">Cancel</button>
          </form>
        )}

        {loading ? (
          <div className="text-gray-600 text-sm">Loading...</div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-4">📁</p>
            <p>No workspaces yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {workspaces.map((ws) => (
              <Link
                key={ws._id}
                href={`/workspace/${ws._id}`}
                className="card flex items-center gap-4 hover:border-violet-600/40 transition-colors duration-200 group"
              >
                <span className="text-2xl">{ws.icon}</span>
                <div>
                  <h2 className="text-white font-medium group-hover:text-violet-400 transition-colors">
                    {ws.name}
                  </h2>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {ws.members?.length || 1} member{ws.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
