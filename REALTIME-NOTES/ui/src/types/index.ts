export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'code'
  | 'quote'
  | 'divider'
  | 'todo'

export interface Block {
  id: string
  type: BlockType
  content: string
  meta: {
    checked?: boolean
    language?: string
    indent?: number
  }
  createdAt: string
  updatedAt: string
}

export interface Page {
  _id: string
  title: string
  icon: string
  workspaceId: string
  createdBy: string
  lastEditedBy: string | null
  lastEditedAt: string | null
  parentPageId: string | null
  blocks: Block[]
  version: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  _id: string
  name: string
  icon: string
  ownerId: string
  members: WorkspaceMember[]
  createdAt: string
}

export interface WorkspaceMember {
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: string
}

export interface User {
  _id: string
  name: string
  email: string
  avatar: string | null
}

export interface ActiveUser {
  socketId: string
  userId: string
  name: string
  color: string
}

export type OperationType = 'insertBlock' | 'updateBlock' | 'deleteBlock' | 'moveBlock'

export interface Operation {
  type: OperationType
  blockId?: string
  block?: Partial<Block>
  position?: number
  newIndex?: number
  content?: string
}

export interface RemoteOperation {
  operation: Operation
  userId: string
  name: string
  color: string
  version: number
}
