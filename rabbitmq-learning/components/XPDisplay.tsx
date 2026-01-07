'use client'

import { getLevelInfo, TOTAL_MAX_XP, UserProgress } from '@/lib/progress'

interface XPDisplayProps {
  progress: UserProgress
  showDetails?: boolean
}

export default function XPDisplay({ progress, showDetails = true }: XPDisplayProps) {
  const levelInfo = getLevelInfo(progress.currentLevel)

  // Calculate progress within current level
  const levelProgress = progress.totalXP - levelInfo.minXP
  const levelRange = levelInfo.maxXP - levelInfo.minXP
  const levelPercent = Math.min((levelProgress / levelRange) * 100, 100)

  return (
    <div className="bg-[#25252b] rounded-xl p-4 border border-[#393941]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: levelInfo.color + '20', border: `2px solid ${levelInfo.color}` }}
          >
            {progress.currentLevel === 'ekspert' ? '🏆' :
             progress.currentLevel === 'kompetent' ? '⭐' : '🌱'}
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: levelInfo.color }}>
              {levelInfo.name}
            </div>
            <div className="text-sm text-gray-400">
              {progress.totalXP} / {TOTAL_MAX_XP} XP
            </div>
          </div>
        </div>
      </div>

      {/* Level progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-[#393941] rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${levelPercent}%`,
              backgroundColor: levelInfo.color
            }}
          />
        </div>
      </div>

      {showDetails && progress.currentLevel !== 'ekspert' && (
        <div className="text-xs text-gray-500 text-center">
          {levelInfo.maxXP - progress.totalXP + 1} XP til neste nivå
        </div>
      )}

      {showDetails && progress.currentLevel === 'ekspert' && (
        <div className="text-xs text-center" style={{ color: levelInfo.color }}>
          Maksimalt nivå oppnådd! 🎉
        </div>
      )}
    </div>
  )
}
