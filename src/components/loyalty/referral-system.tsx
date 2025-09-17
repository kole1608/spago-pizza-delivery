'use client'

import { useState } from 'react'
import { Users, Share2, Gift, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ReferralSystemProps {
  className?: string
}

interface ReferralData {
  referralCode: string
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalPointsEarned: number
  recentReferrals: Array<{
    id: string
    friendName: string
    status: 'pending' | 'completed'
    pointsEarned: number
    date: string
  }>
}

const mockReferralData: ReferralData = {
  referralCode: 'SPAGO-JOHN123',
  totalReferrals: 8,
  successfulReferrals: 6,
  pendingReferrals: 2,
  totalPointsEarned: 600,
  recentReferrals: [
    { id: '1', friendName: 'Sarah M.', status: 'completed', pointsEarned: 100, date: '2024-01-18' },
    { id: '2', friendName: 'Mike R.', status: 'pending', pointsEarned: 0, date: '2024-01-15' },
    { id: '3', friendName: 'Lisa K.', status: 'completed', pointsEarned: 100, date: '2024-01-12' },
  ]
}

export function ReferralSystem({ className }: ReferralSystemProps) {
  const [copied, setCopied] = useState(false)
  const [referralData] = useState(mockReferralData)

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareReferral = () => {
    const shareData = {
      title: 'Join Spago Pizza!',
      text: `Use my referral code ${referralData.referralCode} and get 100 points on your first order!`,
      url: `${window.location.origin}?ref=${referralData.referralCode}`
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Refer Friends</h2>
        <p className="text-gray-600">
          Earn 100 points for each friend who places their first order
        </p>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralData.totalReferrals}</p>
            <p className="text-sm text-gray-600">Total Referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralData.successfulReferrals}</p>
            <p className="text-sm text-gray-600">Successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralData.totalPointsEarned}</p>
            <p className="text-sm text-gray-600">Points Earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Share2 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralData.pendingReferrals}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralData.referralCode}
                readOnly
                className="font-mono text-center text-lg font-bold"
              />
              <Button
                onClick={copyReferralCode}
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={shareReferral} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share with Friends
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Share your code with friends</li>
                <li>• They get 100 points on their first order</li>
                <li>• You get 100 points when they order</li>
                <li>• No limit on referrals!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referralData.recentReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{referral.friendName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(referral.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(referral.status)}>
                    {referral.status}
                  </Badge>
                  {referral.pointsEarned > 0 && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      +{referral.pointsEarned} points
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}