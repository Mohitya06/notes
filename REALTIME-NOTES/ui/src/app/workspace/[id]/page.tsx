'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiPlus } from 'react-icons/fi'
import { pagesApi, workspacesApi } from '@/lib/api'
import { Page, Workspace } from '@/types'
import Sidebar from '@/components/Sidebar/Sidebar'

export default function WorkspaceHomePage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params?.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [pages, setPages] = useState<Partial<Page>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login')
      return
    }
    Promise.all([
      workspacesApi.get(workspaceId),
      pagesApi.listByWorkspace(workspaceId),
    ]).then(([{ data: ws }, { data: ps }]) => {
      setWorkspace(ws)
      setPages(ps)
      setLoading(false)
    })
  }, [workspaceId])

  const createPage = async () => {
    const { data } = await pagesApi.create(workspaceId)
    router.push(`/workspace/${workspaceId}/${data._id}`)
  }

  if (loading) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceId={workspaceId} workspaceName={workspace?.name || ''} />
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-5">{workspace?.icon || '📝'}</p>
          <h1 className="text-2xl font-bold text-white mb-2">{workspace?.name}</h1>
          <p className="text-gray-500 text-sm mb-8">
            {pages.length} page{pages.length !== 1 ? 's' : ''} in this workspace
          </p>
          <button onClick={createPage} className="btn-primary flex items-center gap-2 mx-auto">
            <FiPlus size={15} /> Create first page
          </button>
        </div>
      </main>
    </div>
  )
}
