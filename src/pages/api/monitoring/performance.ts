import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Mock performance metrics
    const mockMetrics = {
      server: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
        uptime: 99.9,
        responseTime: Math.random() * 200 + 50,
        errorRate: Math.random() * 5,
        throughput: Math.random() * 1000 + 500
      },
      database: {
        connections: Math.floor(Math.random() * 50) + 10,
        maxConnections: 100,
        queryTime: Math.random() * 100 + 20,
        cacheHitRate: Math.random() * 40 + 60,
        slowQueries: Math.floor(Math.random() * 10),
        indexUsage: Math.random() * 40 + 60
      },
      application: {
        responseTime: Math.random() * 500 + 100,
        errorRate: Math.random() * 5,
        activeUsers: Math.floor(Math.random() * 500) + 100,
        requests: Math.floor(Math.random() * 10000) + 5000,
        memoryUsage: Math.random() * 70 + 20
      },
      business: {
        ordersPerHour: Math.floor(Math.random() * 50) + 20,
        averageOrderValue: Math.random() * 20 + 25,
        deliveryTime: Math.random() * 20 + 25,
        customerSatisfaction: Math.random() * 20 + 80,
        conversionRate: Math.random() * 10 + 5
      },
      health: {
        overall: Math.random() > 0.8 ? 'poor' : Math.random() > 0.3 ? 'good' : 'excellent',
        services: {
          database: Math.random() > 0.9 ? 'down' : 'up',
          api: Math.random() > 0.95 ? 'down' : 'up',
          payment: Math.random() > 0.95 ? 'down' : 'up',
          delivery: Math.random() > 0.9 ? 'down' : 'up'
        }
      },
      alerts: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
        id: `alert_${i}`,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        message: `Performance alert ${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        resolved: Math.random() > 0.7
      })),
      recommendations: [
        'Consider increasing database connection pool size',
        'Monitor memory usage trends',
        'Optimize slow-running queries',
        'Consider adding read replicas for better performance'
      ].slice(0, Math.floor(Math.random() * 4) + 1)
    }

    return res.status(200).json({
      success: true,
      metrics: mockMetrics,
      timestamp: new Date().toISOString(),
      collectionInterval: '30s',
      nextUpdate: new Date(Date.now() + 30000).toISOString()
    })

  } catch (error) {
    console.error('Performance monitoring error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch performance metrics',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
} 
