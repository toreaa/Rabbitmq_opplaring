// Types
export interface ModuleProgress {
  completed: boolean
  quizScore: number
  quizPassed: boolean
  completedAt?: string
}

export interface UserProgress {
  modules: Record<string, ModuleProgress>
  totalXP: number
  currentLevel: 'nybegynner' | 'kompetent' | 'ekspert'
}

// Module metadata
export const MODULES = [
  { slug: '01-hva-er-rabbitmq', title: 'Hva er RabbitMQ?', maxXP: 50, order: 1 },
  { slug: '02-arkitektur', title: 'Arkitektur', maxXP: 60, order: 2 },
  { slug: '03-koer-og-meldinger', title: 'Køer og meldinger', maxXP: 80, order: 3 },
  { slug: '04-exchanges-og-routing', title: 'Exchanges og routing', maxXP: 60, order: 4 },
  { slug: '05-brukere-og-tilgang', title: 'Brukere og tilgang', maxXP: 50, order: 5 },
  { slug: '06-policies-og-konfig', title: 'Policies og konfigurasjon', maxXP: 60, order: 6 },
  { slug: '07-overvaking-og-feilsoking', title: 'Overvåking og feilsøking', maxXP: 60, order: 7 },
  { slug: '08-produksjonsoppsett', title: 'Produksjonsoppsett', maxXP: 60, order: 8 },
] as const

export const TOTAL_MAX_XP = MODULES.reduce((sum, m) => sum + m.maxXP, 0)
export const PASSING_SCORE = 0.6 // 60% for å bestå

// Level thresholds
export function getLevel(xp: number): 'nybegynner' | 'kompetent' | 'ekspert' {
  if (xp >= 351) return 'ekspert'
  if (xp >= 151) return 'kompetent'
  return 'nybegynner'
}

export function getLevelInfo(level: string) {
  switch (level) {
    case 'ekspert':
      return { name: 'Ekspert', minXP: 351, maxXP: TOTAL_MAX_XP, color: '#ff6600' }
    case 'kompetent':
      return { name: 'Kompetent', minXP: 151, maxXP: 350, color: '#22c55e' }
    default:
      return { name: 'Nybegynner', minXP: 0, maxXP: 150, color: '#3b82f6' }
  }
}

// Storage key
const STORAGE_KEY = 'rabbitmq-learning-progress'

// Get default progress
function getDefaultProgress(): UserProgress {
  return {
    modules: {},
    totalXP: 0,
    currentLevel: 'nybegynner',
  }
}

// Load progress from localStorage
export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return getDefaultProgress()

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return getDefaultProgress()
    return JSON.parse(stored)
  } catch {
    return getDefaultProgress()
  }
}

// Save progress to localStorage
export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error('Failed to save progress:', e)
  }
}

// Check if a module is unlocked
export function isModuleUnlocked(slug: string, progress: UserProgress): boolean {
  const moduleIndex = MODULES.findIndex(m => m.slug === slug)

  // First module is always unlocked
  if (moduleIndex === 0) return true

  // Check if previous module is completed
  const previousModule = MODULES[moduleIndex - 1]
  const previousProgress = progress.modules[previousModule.slug]

  return previousProgress?.quizPassed === true
}

// Complete a quiz and update progress
export function completeQuiz(
  slug: string,
  score: number,
  totalQuestions: number,
  progress: UserProgress
): UserProgress {
  const moduleData = MODULES.find(m => m.slug === slug)
  if (!moduleData) return progress

  const percentage = score / totalQuestions
  const passed = percentage >= PASSING_SCORE
  const xpEarned = passed ? Math.round(moduleData.maxXP * percentage) : 0

  // Only update if this is a better score
  const existingProgress = progress.modules[slug]
  const existingXP = existingProgress?.quizScore || 0

  if (xpEarned <= existingXP && existingProgress?.quizPassed) {
    return progress // No improvement
  }

  const xpDiff = xpEarned - existingXP
  const newTotalXP = progress.totalXP + xpDiff

  const newProgress: UserProgress = {
    ...progress,
    totalXP: newTotalXP,
    currentLevel: getLevel(newTotalXP),
    modules: {
      ...progress.modules,
      [slug]: {
        completed: passed,
        quizScore: xpEarned,
        quizPassed: passed,
        completedAt: passed ? new Date().toISOString() : undefined,
      },
    },
  }

  saveProgress(newProgress)
  return newProgress
}

// Reset all progress
export function resetProgress(): UserProgress {
  const defaultProgress = getDefaultProgress()
  saveProgress(defaultProgress)
  return defaultProgress
}
