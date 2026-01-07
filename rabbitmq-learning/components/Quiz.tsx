'use client'

import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { QuizQuestion } from '@/lib/quiz-data'
import { PASSING_SCORE } from '@/lib/progress'

interface QuizProps {
  questions: QuizQuestion[]
  moduleSlug: string
  onComplete: (score: number, total: number) => void
  alreadyPassed?: boolean
}

export default function Quiz({ questions, moduleSlug, onComplete, alreadyPassed = false }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))
  const [quizComplete, setQuizComplete] = useState(false)

  const question = questions[currentQuestion]
  const isCorrect = selectedAnswer === question.correctAnswer
  const finalScore = score + (isCorrect ? 1 : 0)
  const passed = (finalScore / questions.length) >= PASSING_SCORE

  const handleSelect = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleConfirm = () => {
    if (selectedAnswer === null) return

    setShowResult(true)
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = selectedAnswer
    setAnswers(newAnswers)

    if (isCorrect) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      // Quiz complete
      setQuizComplete(true)
      const finalScoreValue = score + (isCorrect ? 1 : 0)

      if ((finalScoreValue / questions.length) >= PASSING_SCORE) {
        // Celebration confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }

      onComplete(finalScoreValue, questions.length)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers(new Array(questions.length).fill(null))
    setQuizComplete(false)
  }

  if (quizComplete) {
    const percentage = Math.round((finalScore / questions.length) * 100)

    return (
      <div className="bg-[#25252b] rounded-xl p-6 border border-[#393941]">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {passed ? '🎉' : '📚'}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {passed ? 'Gratulerer!' : 'Ikke helt der ennå'}
          </h3>
          <p className="text-gray-400 mb-4">
            Du fikk {finalScore} av {questions.length} riktig ({percentage}%)
          </p>

          <div className="h-4 bg-[#393941] rounded-full overflow-hidden mb-4 max-w-xs mx-auto">
            <div
              className={`h-full transition-all duration-500 ${passed ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {passed ? (
            <div className="text-green-400 mb-6">
              ✓ Du har bestått! Neste modul er nå låst opp.
            </div>
          ) : (
            <div className="text-yellow-400 mb-6">
              Du trenger minst {Math.round(PASSING_SCORE * 100)}% for å bestå. Prøv igjen!
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={restartQuiz}
              className="px-6 py-2 bg-[#393941] hover:bg-[#4c4c58] rounded-lg transition"
            >
              {passed ? 'Ta quizen på nytt' : 'Prøv igjen'}
            </button>
            {passed && (
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 bg-[#ff6600] hover:bg-[#ff8533] rounded-lg transition"
              >
                Tilbake til oversikt
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#25252b] rounded-xl p-6 border border-[#393941]">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          Spørsmål {currentQuestion + 1} av {questions.length}
        </span>
        <span className="text-sm text-gray-400">
          Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#393941] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[#ff6600] transition-all duration-300"
          style={{ width: `${((currentQuestion + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="text-xl font-medium mb-6">{question.question}</h3>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          let bgColor = 'bg-[#393941] hover:bg-[#4c4c58]'
          let borderColor = 'border-transparent'

          if (showResult) {
            if (index === question.correctAnswer) {
              bgColor = 'bg-green-500/20'
              borderColor = 'border-green-500'
            } else if (index === selectedAnswer && !isCorrect) {
              bgColor = 'bg-red-500/20'
              borderColor = 'border-red-500'
            }
          } else if (selectedAnswer === index) {
            bgColor = 'bg-[#ff6600]/20'
            borderColor = 'border-[#ff6600]'
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={`
                w-full p-4 rounded-lg text-left transition-all border-2
                ${bgColor} ${borderColor}
                ${showResult ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm
                  ${selectedAnswer === index ? 'border-[#ff6600] bg-[#ff6600] text-white' : 'border-gray-500'}
                  ${showResult && index === question.correctAnswer ? 'border-green-500 bg-green-500 text-white' : ''}
                  ${showResult && index === selectedAnswer && !isCorrect ? 'border-red-500 bg-red-500 text-white' : ''}
                `}>
                  {showResult && index === question.correctAnswer ? '✓' :
                   showResult && index === selectedAnswer && !isCorrect ? '✗' :
                   String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {showResult && question.explanation && (
        <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
          <div className="font-medium mb-1">
            {isCorrect ? '✓ Riktig!' : '✗ Feil svar'}
          </div>
          <div className="text-sm text-gray-300">{question.explanation}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {!showResult ? (
          <button
            onClick={handleConfirm}
            disabled={selectedAnswer === null}
            className={`
              px-6 py-2 rounded-lg transition
              ${selectedAnswer !== null
                ? 'bg-[#ff6600] hover:bg-[#ff8533] text-white'
                : 'bg-[#393941] text-gray-500 cursor-not-allowed'}
            `}
          >
            Bekreft svar
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[#ff6600] hover:bg-[#ff8533] rounded-lg transition text-white"
          >
            {currentQuestion < questions.length - 1 ? 'Neste spørsmål' : 'Se resultat'}
          </button>
        )}
      </div>
    </div>
  )
}
