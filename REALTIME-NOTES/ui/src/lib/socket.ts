import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('token')
    socket = io(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000/collab',
      {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
      },
    )
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
