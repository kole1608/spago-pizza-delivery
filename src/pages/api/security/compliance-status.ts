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

    // Mock compliance status data
    const mockCompliance = {
      overall: {
        score: Math.floor(Math.random() * 20) + 80, // 80-100%
        status: Math.random() > 0.8 ? 'non-compliant' : 'compliant',
        lastAudit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextAudit: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      gdpr: {
        score: Math.floor(Math.random() * 20) + 80,
        status: Math.random() > 0.9 ? 'non-compliant' : 'compliant',
        requirements: [
          { name: 'Data Processing Records', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Right to Erasure', status: Math.random() > 0.9 ? 'non-compliant' : 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Data Portability', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Consent Management', status: 'compliant', lastCheck: new Date().toISOString() }
        ]
      },
      pciDss: {
        score: Math.floor(Math.random() * 15) + 85,
        status: Math.random() > 0.95 ? 'non-compliant' : 'compliant',
        requirements: [
          { name: 'Secure Network', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Payment Data Protection', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Vulnerability Management', status: Math.random() > 0.9 ? 'non-compliant' : 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Access Control', status: 'compliant', lastCheck: new Date().toISOString() }
        ]
      },
      foodSafety: {
        score: Math.floor(Math.random() * 10) + 90,
        status: 'compliant',
        requirements: [
          { name: 'HACCP Standards', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Temperature Control', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Hygiene Protocols', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Allergen Management', status: 'compliant', lastCheck: new Date().toISOString() }
        ]
      },
      accessibility: {
        score: Math.floor(Math.random() * 20) + 75,
        status: Math.random() > 0.8 ? 'partial' : 'compliant',
        requirements: [
          { name: 'WCAG 2.1 Level AA', status: Math.random() > 0.7 ? 'partial' : 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Keyboard Navigation', status: 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Screen Reader Support', status: Math.random() > 0.8 ? 'partial' : 'compliant', lastCheck: new Date().toISOString() },
          { name: 'Color Contrast', status: 'compliant', lastCheck: new Date().toISOString() }
        ]
      },
      security: {
        failedLogins: Math.floor(Math.random() * 50),
        vulnerabilities: Math.floor(Math.random() * 5),
        certificates: {
          ssl: { status: 'valid', expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() },
          payment: { status: 'valid', expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() }
        }
      },
      recommendations: [
        'Review and update privacy policy',
        'Conduct quarterly security assessments',
        'Improve accessibility color contrast',
        'Update SSL certificates before expiration'
      ].slice(0, Math.floor(Math.random() * 4) + 1)
    }

    return res.status(200).json({
      success: true,
      compliance: mockCompliance,
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Valid for 24 hours
    })

  } catch (error) {
    console.error('Compliance status error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch compliance status',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
} 
