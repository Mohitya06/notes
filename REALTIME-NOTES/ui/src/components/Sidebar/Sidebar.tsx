'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FiPlus, FiFileText, FiChevronLeft } from 'react-icons/fi'
import { pagesApi } from '@/lib/api'
import { Page } from '@/types'

interface SidebarProps {
  workspaceId: string
  workspaceName: string
}

export default function Sidebar({ workspaceId, workspaceName }: SidebarProps) {
  const params = useParams()
  const [pages, setPages] = useState<Partial<Page>[]>([])

  useEffect(() => {
    pagesApi.listByWorkspace(workspaceId).then(({ data }) => setPages(data))
  }, [workspaceId])

  const createPage = async () => {
    const { data } = await pagesApi.create(workspaceId)
    setPages((prev) => [...prev, data])
  }

  return (
    <aside className="w-60 flex-shrink-0 h-screen bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <Link
          href="/workspace"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-xs mb-3 transition-colors"
        >
          <FiChevronLeft size={12} /> All workspaces
        </Link>
        <p className="text-white font-semibold text-sm truncate">{workspaceName}</p>
      </div>

      {/* Pages list */}
      <div className="flex-1 overflow-y-auto py-2">
        {pages.map((page) => (
          <Link
            key={page._id}
            href={`/workspace/${workspaceId}/${page._id}`}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-[#1a1a1a] ${
              params?.pageId === page._id ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>{page.icon || '📄'}</span>
            <span className="truncate">{page.title || 'Untitled'}</span>
          </Link>
        ))}
      </div>

      {/* New page */}
      <div className="px-4 py-4 border-t border-[#1a1a1a]">
        <button
          onClick={createPage}
          className="w-full flex items-center gap-2 text-gray-600 hover:text-gray-300 text-sm transition-colors py-1"
        >
          <FiPlus size={14} /> New page
        </button>
      </div>
    </aside>
  )
}
