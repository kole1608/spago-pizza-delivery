'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Crown, 
  Star, 
  Gift, 
  Users, 
  Calendar,
  Flame,
  Trophy,
  TrendingUp,
  Heart,
  Zap,
  Target,
  Award
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PointsTracker } from './points-tracker'
import { RewardsGallery } from './rewards-gallery'
import { ReferralSystem } from './referral-system'
import { AchievementBadges } from './achievement-badges'

interface LoyaltyData {
  currentPoints: number
  totalEarned: number
  totalRedeemed: number
  currentTier: {
    name: string
    benefits: string[]
    pointsMultiplier: number
    minPoints: number
    maxPoints: number
  }
  nextTier?: {
    name: string
    benefits: string[]
    minPoints: number
  }
  pointsToNextTier: number
  memberSince: string
  achievements: Array<{
    id: string
    title: string
    description: string
    earnedAt: string
    pointsAwarded: number
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  }>
  recentTransactions: Array<{
    id: string
    points: number
    type: 'earned' | 'redeemed'
    reason: string
    date: string
  }>
  personalizedOffers: Array<{
    id: string
    title: string
    description: string
    discount: number
    validUntil: string
    pointsCost?: number
  }>
}

interface LoyaltyDashboardProps {
  className?: string
}

const TIER_COLORS = {
  Bronze: 'bg-amber-600',
  Silver: 'bg-gray-400',
  Gold: 'bg-yellow-500',
  Platinum: 'bg-purple-600'
}

const TIER_ICONS = {
  Bronze: Star,
  Silver: Crown,
  Gold: Trophy,
  Platinum: Award
}

export function LoyaltyDashboard({ className }: LoyaltyDashboardProps) {
  const { data: session } = useSession()
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showTierAnimation, setShowTierAnimation] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchLoyaltyData()
    }
  }, [session?.user?.id])

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch('/api/loyalty/customer-stats')
      if (response.ok) {
        const data = await response.json()
        setLoyaltyData(data)
        
        // Check for recent tier upgrade
        const lastTransaction = data.recentTransactions[0]
        if (lastTransaction?.reason.includes('Tier upgrade')) {
          setShowTierAnimation(true)
          setTimeout(() => setShowTierAnimation(false), 3000)
        }
      }
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTierProgress = () => {
    if (!loyaltyData?.nextTier) return 100
    
    const currentTierMin = loyaltyData.currentTier.minPoints
    const nextTierMin = loyaltyData.nextTier.minPoints
    const totalEarned = loyaltyData.totalEarned
    
    const progress = ((totalEarned - currentTierMin) / (nextTierMin - currentTierMin)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  const getTierIcon = (tierName: string) => {
    const IconComponent = TIER_ICONS[tierName as keyof typeof TIER_ICONS] || Star
    return IconComponent
  }

  const getTierColor = (tierName: string) => {
    return TIER_COLORS[tierName as keyof typeof TIER_COLORS] || 'bg-gray-400'
  }

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Join Our Loyalty Program</h3>
            <p className="text-gray-600 mb-4">
              Sign in to start earning points and unlock exclusive rewards!
            </p>
            <Button>Sign In</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!loyaltyData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <p>Unable to load loyalty data</p>
            <Button onClick={fetchLoyaltyData} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const TierIcon = getTierIcon(loyaltyData.currentTier.name)

  return (
    <div className={className}>
      {/* Tier Upgrade Animation */}
      <AnimatePresence>
        {showTierAnimation && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="border-yellow-400 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Crown className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-900">Tier Upgraded!</h4>
                    <p className="text-sm text-yellow-700">
                      Welcome to {loyaltyData.currentTier.name} tier!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Program</h1>
        <p className="text-gray-600">
          Track your points, unlock rewards, and enjoy exclusive benefits
        </p>
      </div>

      {/* Current Status Card */}
      <Card className="mb-6 overflow-hidden relative">
        <div className={`absolute inset-0 opacity-10 ${getTierColor(loyaltyData.currentTier.name)}`}></div>
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${getTierColor(loyaltyData.currentTier.name)}`}>
                <TierIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {loyaltyData.currentTier.name} Member
                </h2>
                <p className="text-gray-600">
                  Member since {new Date(loyaltyData.memberSince).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {loyaltyData.currentPoints.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">points available</p>
            </div>
          </div>

          {/* Tier Progress */}
          {loyaltyData.nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progress to {loyaltyData.nextTier.name}</span>
                <span>{loyaltyData.pointsToNextTier} points needed</span>
              </div>
              <Progress value={calculateTierProgress()} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{loyaltyData.currentTier.name}</span>
                <span>{loyaltyData.nextTier.name}</span>
              </div>
            </div>
          )}

          {/* Current Benefits */}
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Your Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {loyaltyData.currentTier.benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {benefit}
                </Badge>
              ))}
              <Badge className="text-xs bg-orange-100 text-orange-800">
                {loyaltyData.currentTier.pointsMultiplier}x Points Multiplier
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {loyaltyData.totalEarned.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {loyaltyData.totalRedeemed.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Redeemed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {loyaltyData.achievements.length}
            </p>
            <p className="text-sm text-gray-600">Achievements</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(loyaltyData.totalEarned / 30)}
            </p>
            <p className="text-sm text-gray-600">Avg Points/Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Offers */}
      {loyaltyData.personalizedOffers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Personalized Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loyaltyData.personalizedOffers.map((offer) => (
                <Card key={offer.id} className="border-dashed border-orange-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{offer.title}</h4>
                      <Badge className="bg-orange-100 text-orange-800">
                        {offer.discount}% OFF
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Valid until {new Date(offer.validUntil).toLocaleDateString()}
                      </span>
                      <Button size="sm">
                        {offer.pointsCost ? `Redeem ${offer.pointsCost} pts` : 'Use Offer'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PointsTracker 
              currentPoints={loyaltyData.currentPoints}
              recentTransactions={loyaltyData.recentTransactions}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loyaltyData.recentTransactions.slice(0, 5).map((transaction) => (
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <RewardsGallery currentPoints={loyaltyData.currentPoints} />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralSystem />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <AchievementBadges achievements={loyaltyData.achievements} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 