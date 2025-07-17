import { NextApiRequest } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { 
  NextApiResponseServerIO, 
  initializeSocketManager,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
} from '@/lib/socket-server'

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('✅ Socket.IO server already running')
    res.end()
    return
  }

  console.log('🚀 Starting Socket.IO server...')
  
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(res.socket.server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    connectionStateRecovery: {
      // Recovery options for reliable connections
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Initialize the socket manager
  const socketManager = initializeSocketManager(io)

  res.socket.server.io = io

  console.log('✅ Socket.IO server started successfully')
  console.log(`📡 WebSocket endpoint: ${req.headers.host}/api/socket`)
  
  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
} 
