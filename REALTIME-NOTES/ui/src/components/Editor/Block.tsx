'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { Block as BlockType, BlockType as BT } from '@/types'

const PLACEHOLDER: Record<BT, string> = {
  paragraph: "Type '/' for commands…",
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bulletList: 'List item',
  numberedList: 'List item',
  code: 'Code…',
  quote: 'Quote…',
  divider: '',
  todo: 'To-do',
}

const CLASS_MAP: Record<BT, string> = {
  paragraph: 'text-gray-300 text-base leading-relaxed',
  heading1: 'text-white text-3xl font-bold leading-tight',
  heading2: 'text-white text-2xl font-semibold leading-tight',
  heading3: 'text-white text-xl font-semibold leading-snug',
  bulletList: 'text-gray-300 text-base leading-relaxed ml-5 list-disc',
  numberedList: 'text-gray-300 text-base leading-relaxed ml-5 list-decimal',
  code: 'font-mono text-emerald-400 text-sm bg-[#1a1a1a] rounded px-3 py-2',
  quote: 'text-gray-400 italic text-base border-l-2 border-violet-600 pl-4',
  divider: '',
  todo: 'text-gray-300 text-base leading-relaxed flex items-center gap-2',
}

interface BlockProps {
  block: BlockType
  index: number
  isFocused: boolean
  remoteTypingUsers: { name: string; color: string }[]
  onFocus: (id: string) => void
  onContentChange: (id: string, content: string) => void
  onTypeChange: (id: string, type: BT) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, id: string, index: number) => void
  onCheckToggle: (id: string, checked: boolean) => void
}

export default function Block({
  block,
  index,
  isFocused,
  remoteTypingUsers,
  onFocus,
  onContentChange,
  onTypeChange,
  onKeyDown,
  onCheckToggle,
}: BlockProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isFocused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isFocused])

  if (block.type === 'divider') {
    return (
      <div className="py-2">
        <hr className="border-[#2a2a2a]" />
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Remote typing indicator */}
      {remoteTypingUsers.length > 0 && (
        <div className="absolute -top-5 left-0 flex gap-1">
          {remoteTypingUsers.map((u) => (
            <span
              key={u.name}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: u.color + '20', color: u.color }}
            >
              {u.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        {block.type === 'todo' && (
          <input
            type="checkbox"
            checked={!!block.meta?.checked}
            onChange={(e) => onCheckToggle(block.id, e.target.checked)}
            className="mt-1 accent-violet-600 flex-shrink-0 cursor-pointer"
          />
        )}

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={PLACEHOLDER[block.type]}
          onFocus={() => onFocus(block.id)}
          onInput={(e) => onContentChange(block.id, (e.target as HTMLDivElement).innerText)}
          onKeyDown={(e) => onKeyDown(e, block.id, index)}
          className={`flex-1 min-h-[1.5em] focus:outline-none ${CLASS_MAP[block.type]}`}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      </div>
    </div>
  )
}
