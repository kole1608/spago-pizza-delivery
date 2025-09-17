'use client'

import { useState } from 'react'
import { Gift, Star, Clock, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Reward {
  id: string
  title: string
  description: string
  pointsCost: number
  category: 'food' | 'discount' | 'delivery' | 'exclusive'
  image?: string
  validUntil?: string
  maxRedemptions?: number
  currentRedemptions: number
}

interface RewardsGalleryProps {
  currentPoints: number
  className?: string
}

const mockRewards: Reward[] = [
  {
    id: '1',
    title: 'Free Medium Pizza',
    description: 'Redeem for any medium pizza from our menu',
    pointsCost: 500,
    category: 'food',
    validUntil: '2024-12-31',
    maxRedemptions: 100,
    currentRedemptions: 25
  },
  {
    id: '2',
    title: '20% Off Next Order',
    description: 'Get 20% discount on your entire next order',
    pointsCost: 200,
    category: 'discount',
    validUntil: '2024-06-30',
    maxRedemptions: 500,
    currentRedemptions: 150
  },
  {
    id: '3',
    title: 'Free Delivery',
    description: 'Free delivery on your next order (any amount)',
    pointsCost: 100,
    category: 'delivery',
    maxRedemptions: 1000,
    currentRedemptions: 320
  },
  {
    id: '4',
    title: 'VIP Early Access',
    description: 'Get early access to new menu items and special events',
    pointsCost: 1000,
    category: 'exclusive',
    maxRedemptions: 50,
    currentRedemptions: 12
  }
]

export function RewardsGallery({ currentPoints, className }: RewardsGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [redeeming, setRedeeming] = useState<string | null>(null)

  const categories = [
    { id: 'all', label: 'All Rewards', icon: Gift },
    { id: 'food', label: 'Food', icon: Gift },
    { id: 'discount', label: 'Discounts', icon: Star },
    { id: 'delivery', label: 'Delivery', icon: Clock },
    { id: 'exclusive', label: 'Exclusive', icon: Check }
  ]

  const filteredRewards = selectedCategory === 'all' 
    ? mockRewards 
    : mockRewards.filter(reward => reward.category === selectedCategory)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'bg-orange-100 text-orange-800'
      case 'discount': return 'bg-green-100 text-green-800'
      case 'delivery': return 'bg-blue-100 text-blue-800'
      case 'exclusive': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRedeem = async (rewardId: string) => {
    setRedeeming(rewardId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In real app, this would call the redemption API
    console.log('Redeeming reward:', rewardId)
    
    setRedeeming(null)
  }

  const canAfford = (pointsCost: number) => currentPoints >= pointsCost

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rewards Gallery</h2>
        <p className="text-gray-600">
          You have <span className="font-bold text-blue-600">{currentPoints}</span> points to spend
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => {
          const IconComponent = category.icon
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {category.label}
            </Button>
          )
        })}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward) => {
          const affordable = canAfford(reward.pointsCost)
          const isRedeeming = redeeming === reward.id
          
          return (
            <Card key={reward.id} className={`transition-all ${affordable ? 'hover:shadow-lg' : 'opacity-60'}`}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{reward.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                    </div>
                    <Badge className={getCategoryColor(reward.category)} variant="secondary">
                      {reward.category}
                    </Badge>
                  </div>

                  {/* Points Cost */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-lg">{reward.pointsCost}</span>
                      <span className="text-sm text-gray-500">points</span>
                    </div>
                    {affordable && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    )}
                  </div>

                  {/* Availability */}
                  {reward.maxRedemptions && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Available</span>
                        <span>{reward.maxRedemptions - reward.currentRedemptions} left</span>
                      </div>
                      <Progress 
                        value={(reward.currentRedemptions / reward.maxRedemptions) * 100} 
                        className="h-2" 
                      />
                    </div>
                  )}

                  {/* Expiry */}
                  {reward.validUntil && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Valid until {new Date(reward.validUntil).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Redeem Button */}
                  <Button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!affordable || isRedeeming || (reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions)}
                    className="w-full"
                    variant={affordable ? 'default' : 'outline'}
                  >
                    {isRedeeming ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Redeeming...
                      </div>
                    ) : !affordable ? (
                      `Need ${reward.pointsCost - currentPoints} more points`
                    ) : (
                      'Redeem Now'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards found</h3>
          <p className="text-gray-600">
            Try selecting a different category or check back later for new rewards.
          </p>
        </div>
      )}
    </div>
  )
}