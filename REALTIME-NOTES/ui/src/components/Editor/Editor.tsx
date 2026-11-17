'use client'

import { useState, useCallback, useRef, KeyboardEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Block as BlockType, BlockType as BT, ActiveUser, RemoteOperation } from '@/types'
import Block from './Block'
import { useSocket } from '@/hooks/useSocket'

const SLASH_COMMANDS: { label: string; type: BT; icon: string }[] = [
  { label: 'Paragraph', type: 'paragraph', icon: '¶' },
  { label: 'Heading 1', type: 'heading1', icon: 'H1' },
  { label: 'Heading 2', type: 'heading2', icon: 'H2' },
  { label: 'Heading 3', type: 'heading3', icon: 'H3' },
  { label: 'Bullet list', type: 'bulletList', icon: '•' },
  { label: 'Numbered list', type: 'numberedList', icon: '1.' },
  { label: 'Code block', type: 'code', icon: '</>' },
  { label: 'Quote', type: 'quote', icon: '"' },
  { label: 'To-do', type: 'todo', icon: '☐' },
  { label: 'Divider', type: 'divider', icon: '—' },
]

interface EditorProps {
  pageId: string
  initialBlocks: BlockType[]
  initialTitle: string
}

export default function Editor({ pageId, initialBlocks, initialTitle }: EditorProps) {
  const [blocks, setBlocks] = useState<BlockType[]>(initialBlocks)
  const [title, setTitle] = useState(initialTitle)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [slashMenu, setSlashMenu] = useState<{ blockId: string; visible: boolean }>({ blockId: '', visible: false })
  const [typingMap, setTypingMap] = useState<Record<string, { name: string; color: string }[]>>({})
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // ─── WebSocket handlers ───────────────────────────────────────────────────

  const handleRemoteOperation = useCallback((data: RemoteOperation) => {
    setBlocks((prev) => {
      const op = data.operation
      let next = [...prev]

      if (op.type === 'insertBlock' && op.block) {
        const pos = op.position ?? next.length
        const newBlock = { ...op.block, id: op.block.id || uuidv4() } as BlockType
        next.splice(pos, 0, newBlock)
      }

      if (op.type === 'updateBlock' && op.blockId) {
        next = next.map((b) =>
          b.id === op.blockId
            ? { ...b, content: op.content ?? b.content, type: op.block?.type ?? b.type, meta: op.block?.meta ?? b.meta }
            : b,
        )
      }

      if (op.type === 'deleteBlock' && op.blockId) {
        next = next.filter((b) => b.id !== op.blockId)
      }

      if (op.type === 'moveBlock' && op.blockId && op.newIndex !== undefined) {
        const idx = next.findIndex((b) => b.id === op.blockId)
        if (idx !== -1) {
          const [moved] = next.splice(idx, 1)
          next.splice(op.newIndex, 0, moved)
        }
      }

      return next
    })
  }, [])

  const handlePresenceUpdate = useCallback((users: ActiveUser[]) => {
    setActiveUsers(users)
  }, [])

  const handleTitleUpdate = useCallback((t: string) => {
    setTitle(t)
  }, [])

  const handleUserTyping = useCallback((data: any) => {
    const { blockId, name, color, isTyping } = data
    setTypingMap((prev) => {
      const existing = prev[blockId] || []
      if (isTyping) {
        if (!existing.find((u) => u.name === name)) {
          return { ...prev, [blockId]: [...existing, { name, color }] }
        }
        return prev
      } else {
        return { ...prev, [blockId]: existing.filter((u) => u.name !== name) }
      }
    })
  }, [])

  const { sendOperation, sendTitleUpdate, sendCursorMove, sendTyping } = useSocket({
    pageId,
    onRemoteOperation: handleRemoteOperation,
    onPresenceUpdate: handlePresenceUpdate,
    onTitleUpdate: handleTitleUpdate,
    onUserJoined: (user) => setActiveUsers((p) => [...p.filter((u) => u.socketId !== user.socketId), user]),
    onUserLeft: ({ socketId }) => setActiveUsers((p) => p.filter((u) => u.socketId !== socketId)),
    onCursorUpdate: () => {},
  })

  // ─── Block operations ─────────────────────────────────────────────────────

  const handleContentChange = useCallback(
    (blockId: string, content: string) => {
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, content } : b)))

      if (content === '/') {
        setSlashMenu({ blockId, visible: true })
        return
      }
      setSlashMenu({ blockId: '', visible: false })

      sendOperation({ type: 'updateBlock', blockId, content })

      sendTyping(blockId, true)
      if (typingTimeouts.current[blockId]) clearTimeout(typingTimeouts.current[blockId])
      typingTimeouts.current[blockId] = setTimeout(() => sendTyping(blockId, false), 1500)
    },
    [sendOperation, sendTyping],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, blockId: string, index: number) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const newBlock: BlockType = {
          id: uuidv4(),
          type: 'paragraph',
          content: '',
          meta: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setBlocks((prev) => {
          const next = [...prev]
          next.splice(index + 1, 0, newBlock)
          return next
        })
        setFocusedId(newBlock.id)
        sendOperation({ type: 'insertBlock', block: newBlock, position: index + 1 })
      }

      if (e.key === 'Backspace') {
        const block = blocks.find((b) => b.id === blockId)
        if (block?.content === '' && blocks.length > 1) {
          e.preventDefault()
          setBlocks((prev) => prev.filter((b) => b.id !== blockId))
          setFocusedId(blocks[index - 1]?.id || blocks[index + 1]?.id || null)
          sendOperation({ type: 'deleteBlock', blockId })
        }
      }
    },
    [blocks, sendOperation],
  )

  const handleTypeChange = useCallback(
    (blockId: string, type: BT) => {
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, type, content: '' } : b)))
      setSlashMenu({ blockId: '', visible: false })
      sendOperation({ type: 'updateBlock', blockId, block: { type } })
    },
    [sendOperation],
  )

  const handleCheckToggle = useCallback(
    (blockId: string, checked: boolean) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, meta: { ...b.meta, checked } } : b)),
      )
      sendOperation({ type: 'updateBlock', blockId, block: { meta: { checked } } })
    },
    [sendOperation],
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value)
      sendTitleUpdate(e.target.value)
    },
    [sendTitleUpdate],
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Active users */}
      {activeUsers.length > 0 && (
        <div className="flex gap-1.5 mb-6">
          {activeUsers.map((u) => (
            <div
              key={u.socketId}
              title={u.name}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: u.color }}
            >
              {u.name[0].toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Page title */}
      <input
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="w-full bg-transparent text-white text-4xl font-extrabold mb-8 focus:outline-none placeholder-gray-700"
      />

      {/* Blocks */}
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <Block
            key={block.id}
            block={block}
            index={index}
            isFocused={focusedId === block.id}
            remoteTypingUsers={typingMap[block.id] || []}
            onFocus={setFocusedId}
            onContentChange={handleContentChange}
            onTypeChange={handleTypeChange}
            onKeyDown={handleKeyDown}
            onCheckToggle={handleCheckToggle}
          />
        ))}
      </div>

      {/* Slash command menu */}
      {slashMenu.visible && (
        <div className="mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl w-64 overflow-hidden z-50">
          <p className="text-gray-600 text-xs px-3 py-2 border-b border-[#2a2a2a]">Block type</p>
          {SLASH_COMMANDS.map((cmd) => (
            <button
              key={cmd.type}
              onClick={() => handleTypeChange(slashMenu.blockId, cmd.type)}
              className="w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-[#222] text-sm"
            >
              <span className="text-gray-500 w-7 font-mono text-xs">{cmd.icon}</span>
              <span className="text-gray-300">{cmd.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
