import { SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export function setIO(socketIO: SocketIOServer): void {
  io = socketIO
}

export function emitMessage(message: any): void {
  if (io) {
    io.emit('message', message)
  }
}

export function emitStatus(id: string, status: string): void {
  if (io) {
    io.emit('status', { id, status })
  }
}
