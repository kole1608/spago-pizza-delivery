import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Mock implementation until full delivery tracking is implemented
    if (req.method === 'GET') {
      return res.status(200).json({
        message: 'Delivery tracking temporarily disabled',
        status: 'success',
        data: {
          tracking: 'mock',
          location: { lat: 44.8176, lng: 20.4633 }, // Belgrade center
          status: 'on_route',
          eta: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
        }
      })
    }

    if (req.method === 'POST') {
      return res.status(200).json({
        message: 'Location update received',
        status: 'success'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Delivery tracking error:', error)
    res.status(500).json({ 
      error: 'Failed to process delivery tracking',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
} 
