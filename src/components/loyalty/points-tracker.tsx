'use client'

import { useState } from 'react'
import { Star, TrendingUp, Gift, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PointsTrackerProps {
  currentPoints: number
  recentTransactions: Array<{
    id: string
    points: number
    type: 'earned' | 'redeemed'
    reason: string
    date: string
  }>
  className?: string
}

export function PointsTracker({ currentPoints, recentTransactions, className }: PointsTrackerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const totalEarned = recentTransactions
    .filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + t.points, 0)

  const totalRedeemed = recentTransactions
    .filter(t => t.type === 'redeemed')
    .reduce((sum, t) => sum + t.points, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600" />
          Points Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Points Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Available</p>
              <p className="text-xl font-bold text-blue-800">{currentPoints}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-900">Earned</p>
              <p className="text-xl font-bold text-green-800">+{totalEarned}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-900">Redeemed</p>
              <p className="text-xl font-bold text-red-800">-{totalRedeemed}</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Recent Activity</h4>
            {recentTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-sm">{transaction.reason}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-bold text-sm ${
                  transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}