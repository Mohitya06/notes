'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pagesApi, workspacesApi } from '@/lib/api'
import { Page, Workspace } from '@/types'
import Sidebar from '@/components/Sidebar/Sidebar'
import Editor from '@/components/Editor/Editor'

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params?.pageId as string
  const workspaceId = params?.id as string

  const [page, setPage] = useState<Page | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login')
      return
    }

    Promise.all([
      pagesApi.get(pageId),
      workspacesApi.get(workspaceId),
    ]).then(([{ data: pageData }, { data: wsData }]) => {
      setPage(pageData)
      setWorkspace(wsData)
      setLoading(false)
    }).catch(() => router.push('/workspace'))
  }, [pageId, workspaceId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading page…</div>
      </div>
    )
  }

  if (!page || !workspace) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceId={workspaceId} workspaceName={workspace.name} />
      <main className="flex-1 overflow-y-auto">
        <Editor
          pageId={pageId}
          initialBlocks={page.blocks}
          initialTitle={page.title}
        />
      </main>
    </div>
  )
}
