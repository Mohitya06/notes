'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { Block, Operation, RemoteOperation, ActiveUser, Page } from '@/types'

interface UseSocketOptions {
  pageId: string
  onRemoteOperation: (data: RemoteOperation) => void
  onPresenceUpdate: (users: ActiveUser[]) => void
  onTitleUpdate: (title: string) => void
  onUserJoined: (user: ActiveUser) => void
  onUserLeft: (data: { socketId: string; userId: string }) => void
  onCursorUpdate: (data: ActiveUser & { blockId: string; offset: number }) => void
}

export function useSocket(opts: UseSocketOptions) {
  const socket = useRef(getSocket())
  const clientOpCounter = useRef(0)

  useEffect(() => {
    const s = socket.current

    s.emit('join-page', { pageId: opts.pageId })

    s.on('remote-operation', opts.onRemoteOperation)
    s.on('presence-update', ({ users }) => opts.onPresenceUpdate(users))
    s.on('title-updated', ({ title }) => opts.onTitleUpdate(title))
    s.on('user-joined', opts.onUserJoined)
    s.on('user-left', opts.onUserLeft)
    s.on('cursor-update', opts.onCursorUpdate)

    return () => {
      s.emit('leave-page', { pageId: opts.pageId })
      s.off('remote-operation', opts.onRemoteOperation)
      s.off('presence-update')
      s.off('title-updated')
      s.off('user-joined', opts.onUserJoined)
      s.off('user-left', opts.onUserLeft)
      s.off('cursor-update', opts.onCursorUpdate)
    }
  }, [opts.pageId])

  const sendOperation = useCallback(
    (operation: Operation) => {
      const clientOpId = `${Date.now()}-${++clientOpCounter.current}`
      socket.current.emit('operation', {
        pageId: opts.pageId,
        operation,
        clientOpId,
      })
      return clientOpId
    },
    [opts.pageId],
  )

  const sendTitleUpdate = useCallback(
    (title: string) => {
      socket.current.emit('update-title', { pageId: opts.pageId, title })
    },
    [opts.pageId],
  )

  const sendCursorMove = useCallback(
    (blockId: string, offset: number) => {
      socket.current.emit('cursor-move', { pageId: opts.pageId, blockId, offset })
    },
    [opts.pageId],
  )

  const sendTyping = useCallback(
    (blockId: string, isTyping: boolean) => {
      socket.current.emit('typing', { pageId: opts.pageId, blockId, isTyping })
    },
    [opts.pageId],
  )

  return { sendOperation, sendTitleUpdate, sendCursorMove, sendTyping }
}
