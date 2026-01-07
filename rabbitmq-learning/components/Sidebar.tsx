'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MODULES, isModuleUnlocked, UserProgress } from '@/lib/progress'

interface SidebarProps {
  progress: UserProgress
}

export default function Sidebar({ progress }: SidebarProps) {
  const pathname = usePathname()

  const completedCount = Object.values(progress.modules).filter(m => m.quizPassed).length
  const progressPercent = (completedCount / MODULES.length) * 100

  return (
    <aside className="w-72 bg-[#25252b] border-r border-[#393941] h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#393941]">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="text-2xl">🐰</span>
          <span className="font-bold text-lg">RabbitMQ Læring</span>
        </Link>
      </div>

      {/* Overall Progress */}
      <div className="p-4 border-b border-[#393941]">
        <div className="text-sm text-gray-400 mb-2">Fremgang</div>
        <div className="h-2 bg-[#393941] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {completedCount} av {MODULES.length} moduler fullført
        </div>
      </div>

      {/* Module List */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {MODULES.map((module, index) => {
            const isUnlocked = isModuleUnlocked(module.slug, progress)
            const moduleProgress = progress.modules[module.slug]
            const isActive = pathname === `/modul/${module.slug}`
            const isCompleted = moduleProgress?.quizPassed

            return (
              <Link
                key={module.slug}
                href={isUnlocked ? `/modul/${module.slug}` : '#'}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-[#ff6600] text-white'
                    : isUnlocked
                      ? 'hover:bg-[#2d2d35] text-gray-300'
                      : 'opacity-50 cursor-not-allowed text-gray-500'
                  }
                `}
                onClick={(e) => {
                  if (!isUnlocked) e.preventDefault()
                }}
              >
                {/* Status Icon */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${isCompleted
                    ? 'bg-green-500 text-white'
                    : isUnlocked
                      ? 'bg-[#393941] text-gray-300'
                      : 'bg-[#2d2d35] text-gray-600'
                  }
                `}>
                  {isCompleted ? '✓' : isUnlocked ? index + 1 : '🔒'}
                </div>

                {/* Module Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${!isUnlocked && 'text-gray-500'}`}>
                    {module.title}
                  </div>
                  {isCompleted && moduleProgress && (
                    <div className="text-xs text-green-400">
                      {moduleProgress.quizScore} XP
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#393941] text-xs text-gray-500 text-center">
        RabbitMQ Opplæring v1.0
      </div>
    </aside>
  )
}
