'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import XPDisplay from '@/components/XPDisplay'
import { loadProgress, MODULES, isModuleUnlocked, UserProgress, resetProgress, TOTAL_MAX_XP } from '@/lib/progress'

export default function Home() {
  const [progress, setProgress] = useState<UserProgress | null>(null)

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Laster...</div>
      </div>
    )
  }

  const completedCount = Object.values(progress.modules).filter(m => m.quizPassed).length

  // Find next unlocked module that hasn't been completed
  const nextModule = MODULES.find(m => {
    const isUnlocked = isModuleUnlocked(m.slug, progress)
    const isCompleted = progress.modules[m.slug]?.quizPassed
    return isUnlocked && !isCompleted
  })

  return (
    <div className="min-h-screen flex">
      <Sidebar progress={progress} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">RabbitMQ Opplæring</h1>
            <p className="text-gray-400">
              Lær deg RabbitMQ fra grunnleggende konsepter til produksjonsoppsett
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <XPDisplay progress={progress} />

            <div className="bg-[#25252b] rounded-xl p-4 border border-[#393941]">
              <div className="text-sm text-gray-400 mb-1">Moduler fullført</div>
              <div className="text-3xl font-bold">{completedCount} / {MODULES.length}</div>
              <div className="text-sm text-gray-500 mt-1">
                {completedCount === MODULES.length ? 'Alle fullført! 🎉' : `${MODULES.length - completedCount} igjen`}
              </div>
            </div>

            <div className="bg-[#25252b] rounded-xl p-4 border border-[#393941]">
              <div className="text-sm text-gray-400 mb-1">Estimert tid</div>
              <div className="text-3xl font-bold">~2.5t</div>
              <div className="text-sm text-gray-500 mt-1">
                For hele kurset
              </div>
            </div>
          </div>

          {/* Continue Learning */}
          {nextModule && (
            <div className="bg-gradient-to-r from-[#ff6600]/20 to-[#ff8533]/10 rounded-xl p-6 border border-[#ff6600]/30 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#ff8533] mb-1">Fortsett læringen</div>
                  <div className="text-xl font-bold mb-1">{nextModule.title}</div>
                  <div className="text-sm text-gray-400">
                    Modul {MODULES.findIndex(m => m.slug === nextModule.slug) + 1} av {MODULES.length}
                  </div>
                </div>
                <Link
                  href={`/modul/${nextModule.slug}`}
                  className="px-6 py-3 bg-[#ff6600] hover:bg-[#ff8533] rounded-lg font-medium transition"
                >
                  Start →
                </Link>
              </div>
            </div>
          )}

          {/* All Modules */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Alle moduler</h2>

            {/* Section: Grunnlag */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                GRUNNLAG
              </div>
              <div className="space-y-2">
                {MODULES.slice(0, 3).map((module, index) => (
                  <ModuleCard
                    key={module.slug}
                    module={module}
                    index={index}
                    progress={progress}
                  />
                ))}
              </div>
            </div>

            {/* Section: Konfigurasjon */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                KONFIGURASJON
              </div>
              <div className="space-y-2">
                {MODULES.slice(3, 6).map((module, index) => (
                  <ModuleCard
                    key={module.slug}
                    module={module}
                    index={index + 3}
                    progress={progress}
                  />
                ))}
              </div>
            </div>

            {/* Section: Drift */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff6600]"></span>
                DRIFT
              </div>
              <div className="space-y-2">
                {MODULES.slice(6, 8).map((module, index) => (
                  <ModuleCard
                    key={module.slug}
                    module={module}
                    index={index + 6}
                    progress={progress}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Reset Progress (for testing) */}
          <div className="text-center">
            <button
              onClick={() => {
                if (confirm('Er du sikker på at du vil nullstille all fremgang?')) {
                  resetProgress()
                  setProgress(loadProgress())
                }
              }}
              className="text-sm text-gray-500 hover:text-gray-400 transition"
            >
              Nullstill fremgang
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function ModuleCard({
  module,
  index,
  progress
}: {
  module: typeof MODULES[number]
  index: number
  progress: UserProgress
}) {
  const isUnlocked = isModuleUnlocked(module.slug, progress)
  const moduleProgress = progress.modules[module.slug]
  const isCompleted = moduleProgress?.quizPassed

  return (
    <Link
      href={isUnlocked ? `/modul/${module.slug}` : '#'}
      onClick={(e) => !isUnlocked && e.preventDefault()}
      className={`
        block p-4 rounded-lg border transition-all
        ${isCompleted
          ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
          : isUnlocked
            ? 'bg-[#25252b] border-[#393941] hover:border-[#ff6600]/50'
            : 'bg-[#1a1a1f] border-[#2d2d35] opacity-60 cursor-not-allowed'}
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold
          ${isCompleted
            ? 'bg-green-500 text-white'
            : isUnlocked
              ? 'bg-[#393941] text-gray-300'
              : 'bg-[#2d2d35] text-gray-600'}
        `}>
          {isCompleted ? '✓' : isUnlocked ? index + 1 : '🔒'}
        </div>

        <div className="flex-1">
          <div className="font-medium">{module.title}</div>
          <div className="text-sm text-gray-500">
            {isCompleted
              ? `Fullført - ${moduleProgress.quizScore} XP`
              : `${module.maxXP} XP mulig`}
          </div>
        </div>

        {isUnlocked && !isCompleted && (
          <div className="text-[#ff6600]">→</div>
        )}
      </div>
    </Link>
  )
}
