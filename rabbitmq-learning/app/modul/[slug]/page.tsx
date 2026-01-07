'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Quiz from '@/components/Quiz'
import { loadProgress, saveProgress, isModuleUnlocked, completeQuiz, UserProgress, MODULES } from '@/lib/progress'
import { getModuleContent, getModuleBySlug } from '@/lib/content'
import { quizzes } from '@/lib/quiz-data'

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [contentRead, setContentRead] = useState(false)

  const currentModule = getModuleBySlug(slug)
  const content = getModuleContent(slug)
  const questions = quizzes[slug] || []

  useEffect(() => {
    const loaded = loadProgress()
    setProgress(loaded)

    // Check if module is unlocked
    if (!isModuleUnlocked(slug, loaded)) {
      router.push('/')
    }
  }, [slug, router])

  useEffect(() => {
    // Track scroll to bottom to enable quiz
    const handleScroll = () => {
      const scrolled = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      if (scrolled + windowHeight >= documentHeight - 100) {
        setContentRead(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!progress || !currentModule || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Laster...</div>
      </div>
    )
  }

  const moduleProgress = progress.modules[slug]
  const hasPassed = moduleProgress?.quizPassed
  const moduleIndex = MODULES.findIndex(m => m.slug === slug)
  const nextModule = MODULES[moduleIndex + 1]
  const prevModule = MODULES[moduleIndex - 1]

  const handleQuizComplete = (score: number, total: number) => {
    const newProgress = completeQuiz(slug, score, total, progress)
    setProgress(newProgress)
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar progress={progress} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition">Hjem</Link>
            <span>/</span>
            <span className="text-white">{currentModule.title}</span>
          </div>

          {/* Module Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm px-2 py-1 rounded bg-[#393941] text-gray-300">
                Modul {moduleIndex + 1}
              </span>
              {hasPassed && (
                <span className="text-sm px-2 py-1 rounded bg-green-500/20 text-green-400">
                  ✓ Fullført
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold">{currentModule.title}</h1>
          </div>

          {/* Content */}
          {!showQuiz ? (
            <>
              <article className="prose prose-invert max-w-none mb-12">
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(content)
                  }}
                />
              </article>

              {/* Quiz CTA */}
              <div className="bg-[#25252b] rounded-xl p-6 border border-[#393941] mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      {hasPassed ? 'Quiz fullført!' : 'Klar for quiz?'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {hasPassed
                        ? `Du fikk ${moduleProgress.quizScore} XP. Du kan ta quizen på nytt for å forbedre scoren.`
                        : `Test kunnskapen din med ${questions.length} spørsmål. Du trenger 60% for å bestå.`
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuiz(true)}
                    className={`
                      px-6 py-3 rounded-lg font-medium transition
                      ${hasPassed
                        ? 'bg-[#393941] hover:bg-[#4c4c58] text-white'
                        : 'bg-[#ff6600] hover:bg-[#ff8533] text-white'}
                    `}
                  >
                    {hasPassed ? 'Ta quiz på nytt' : 'Start quiz'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowQuiz(false)}
                className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition"
              >
                ← Tilbake til innholdet
              </button>

              <Quiz
                questions={questions}
                moduleSlug={slug}
                onComplete={handleQuizComplete}
                alreadyPassed={hasPassed}
              />
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-[#393941]">
            {prevModule ? (
              <Link
                href={`/modul/${prevModule.slug}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition"
              >
                <span>←</span>
                <div>
                  <div className="text-xs text-gray-500">Forrige</div>
                  <div>{prevModule.title}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextModule && isModuleUnlocked(nextModule.slug, progress) ? (
              <Link
                href={`/modul/${nextModule.slug}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition text-right"
              >
                <div>
                  <div className="text-xs text-gray-500">Neste</div>
                  <div>{nextModule.title}</div>
                </div>
                <span>→</span>
              </Link>
            ) : nextModule ? (
              <div className="flex items-center gap-2 text-gray-500 text-right">
                <div>
                  <div className="text-xs">Neste (låst)</div>
                  <div>{nextModule.title} 🔒</div>
                </div>
              </div>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-2 text-[#ff6600] hover:text-[#ff8533] transition"
              >
                <div>
                  <div className="text-xs">Gratulerer!</div>
                  <div>Tilbake til oversikt</div>
                </div>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Simple markdown to HTML renderer
function renderMarkdown(markdown: string): string {
  let html = markdown
    // Escape HTML
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Restore code blocks
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>')

  // Tables
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim())
    if (cells.every(c => /^[-:]+$/.test(c.trim()))) {
      return '' // Skip separator row
    }
    const isHeader = cells.some(c => c.includes('**'))
    const tag = isHeader ? 'th' : 'td'
    const row = cells.map(c => `<${tag}>${c.trim().replace(/\*\*/g, '')}</${tag}>`).join('')
    return `<tr>${row}</tr>`
  })
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, (match) => {
    return `<table><tbody>${match}</tbody></table>`
  })

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, (match) => {
    return `<ul>${match}</ul>`
  })

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = `<p>${html}</p>`
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-4]>)/g, '$1')
  html = html.replace(/(<\/h[1-4]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1')
  html = html.replace(/<p>(<pre>)/g, '$1')
  html = html.replace(/(<\/pre>)<\/p>/g, '$1')
  html = html.replace(/<p>(<table>)/g, '$1')
  html = html.replace(/(<\/table>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ul>)/g, '$1')
  html = html.replace(/(<\/ul>)<\/p>/g, '$1')

  return html
}
