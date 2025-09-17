'use client'

import { Trophy, Star, Crown, Award, Target, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Achievement {
  id: string
  title: string
  description: string
  earnedAt: string
  pointsAwarded: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface AchievementBadgesProps {
  achievements: Achievement[]
  className?: string
}

const achievementIcons = {
  common: Star,
  rare: Trophy,
  epic: Crown,
  legendary: Award
}

const rarityColors = {
  common: 'bg-gray-100 text-gray-800',
  rare: 'bg-blue-100 text-blue-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-yellow-100 text-yellow-800'
}

export function AchievementBadges({ achievements, className }: AchievementBadgesProps) {
  const sortedAchievements = [...achievements].sort((a, b) => 
    new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
  )

  const getAchievementIcon = (rarity: string) => {
    const IconComponent = achievementIcons[rarity as keyof typeof achievementIcons] || Star
    return IconComponent
  }

  const getRarityColor = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievements</h2>
        <p className="text-gray-600">
          You've unlocked {achievements.length} achievements
        </p>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(rarityColors).map(([rarity, colorClass]) => {
          const count = achievements.filter(a => a.rarity === rarity).length
          const IconComponent = getAchievementIcon(rarity)
          
          return (
            <Card key={rarity}>
              <CardContent className="p-4 text-center">
                <IconComponent className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{rarity}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAchievements.map((achievement) => {
          const IconComponent = getAchievementIcon(achievement.rarity)
          
          return (
            <Card key={achievement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getRarityColor(achievement.rarity)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{achievement.title}</h3>
                      <Badge className={getRarityColor(achievement.rarity)} variant="secondary">
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs font-medium">+{achievement.pointsAwarded}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
          <p className="text-gray-600">
            Start ordering to unlock your first achievement!
          </p>
        </div>
      )}
    </div>
  )
}