# Real-Time Collaborative Notes App

> Multi-user block editor with live presence, conflict resolution, and workspace management.

---

## Project Overview

A Notion-inspired collaborative notes platform where multiple users can edit the same document simultaneously and see each other's changes in real-time via WebSockets.

**Type:** Personal Portfolio Project
**Stack:** Next.js · NestJS · MongoDB · Redis · Socket.io · TypeScript
**Signal:** WebSocket architecture at scale — block-level operational transforms, live presence, cursor tracking

---

## Folder Structure

```
REALTIME-NOTES/
├── ui/     → Next.js 14 (App Router) + TypeScript + Tailwind CSS
└── api/    → NestJS + Socket.io + MongoDB + Redis
```

---

## Architecture

### Data Model

```
User         →  _id, name, email, password, avatar
Workspace    →  _id, name, icon, ownerId, members[{userId, role}]
Page         →  _id, workspaceId, title, icon, blocks[], version, lastEditedBy
Block        →  id (uuid), type, content, meta{}, createdAt, updatedAt
```

### Block Types

| Type | Description |
|------|-------------|
| `paragraph` | Default text |
| `heading1/2/3` | H1, H2, H3 headings |
| `bulletList` | Unordered list item |
| `numberedList` | Ordered list item |
| `code` | Code block (monospace) |
| `quote` | Blockquote with accent border |
| `todo` | Checkbox item |
| `divider` | Horizontal rule |

### WebSocket Events

**Client → Server**

| Event | Payload | Description |
|-------|---------|-------------|
| `join-page` | `{ pageId }` | Join a page room, receive current state |
| `leave-page` | — | Leave the current room |
| `operation` | `{ pageId, operation, clientOpId }` | Send a block operation |
| `update-title` | `{ pageId, title }` | Update page title |
| `cursor-move` | `{ pageId, blockId, offset }` | Broadcast cursor position |
| `typing` | `{ pageId, blockId, isTyping }` | Broadcast typing state |

**Server → Client**

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ socketId, color }` | Assigned color for this session |
| `page-joined` | `{ page, activeUsers }` | Full page data + who's online |
| `remote-operation` | `{ operation, userId, name, color, version }` | Another user's block op |
| `operation-ack` | `{ clientOpId, version, operation }` | Confirm op was applied |
| `title-updated` | `{ title, userId }` | Another user changed the title |
| `user-joined` | `{ socketId, userId, name, color }` | Someone joined the page |
| `user-left` | `{ socketId, userId }` | Someone left the page |
| `presence-update` | `{ users }` | Full list of active users |
| `cursor-update` | `{ userId, blockId, offset, color }` | Another user's cursor |
| `user-typing` | `{ userId, name, color, blockId, isTyping }` | Typing indicator |

### Conflict Resolution Strategy

**Block-level OT (Operational Transform):**
- Each page has a `version` integer (monotonically increasing)
- Each `insertBlock` / `deleteBlock` / `moveBlock` op is applied server-side atomically
- Server increments `version` on every write
- Server broadcasts the confirmed op with the new version to other clients
- Clients apply remote ops to their local state without further conflict (block-level granularity)

**Same-block concurrent edits:**
- Two users editing the **same block simultaneously** → last-write-wins at block content level
- Each `updateBlock` replaces the full block content (not character-level)
- Acceptable trade-off for a block editor (matches how Notion and Confluence work)

**Why not character-level OT?**
Character-level OT (like Google Docs) requires a full CRDT implementation (e.g. Yjs). Block-level OT is correct, simpler to implement, and what most production block editors use.

---

## API Endpoints

```
POST   /api/auth/register        Register user
POST   /api/auth/login           Login, returns JWT
GET    /api/auth/me              Get current user

POST   /api/workspaces           Create workspace
GET    /api/workspaces           List user's workspaces
GET    /api/workspaces/:id       Get workspace

POST   /api/pages                Create page
GET    /api/pages/workspace/:id  List pages in workspace
GET    /api/pages/:id            Get page with blocks
PATCH  /api/pages/:id/title      Update title (REST fallback)
DELETE /api/pages/:id            Soft delete

WS     /collab                   WebSocket namespace (all real-time ops)
```

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)

### API
```bash
cd api
npm install
cp .env.example .env
# Fill in MONGODB_URI, REDIS_HOST/PORT, JWT_SECRET
npm run start:dev
# → http://localhost:5000
```

### UI
```bash
cd ui
npm install
npm run dev
# → http://localhost:3000
```

---

## User Flow

```
1. Register / Login
2. Create or open a Workspace
3. Create a Page
4. Editor opens — socket auto-joins the page room
5. Type to create blocks (Enter = new block, Backspace = delete empty)
6. Type "/" to open the block-type command palette
7. Invite team members (via workspace invite flow)
8. All changes broadcast in real-time to everyone on the page
9. Avatars in top-right show who's currently editing
```

---

## Key Engineering Decisions

| Decision | Why |
|----------|-----|
| Socket.io over raw WebSocket | Rooms, namespaces, reconnection built-in |
| Block-level OT over CRDT | Correct for block editors, far simpler to implement |
| Server-authoritative version | Single source of truth, no client-side merge conflicts |
| Soft delete for pages | Enables undo/restore without complex event sourcing |
| UUID block IDs | Avoids index-based conflicts when two clients insert simultaneously |
| NestJS WebSocket Gateway | Clean separation: HTTP REST + WS in same process |

---

## Deployment Plan

| Layer | Platform |
|-------|----------|
| UI | Vercel |
| API | Railway or Fly.io |
| MongoDB | MongoDB Atlas (free tier) |
| Redis | Upstash (free tier) |
