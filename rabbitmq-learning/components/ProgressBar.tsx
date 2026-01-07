'use client'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  showLabel?: boolean
  color?: 'orange' | 'green' | 'blue'
}

export default function ProgressBar({
  value,
  max,
  className = '',
  showLabel = true,
  color = 'orange'
}: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100)

  const colorClasses = {
    orange: 'from-[#ff6600] to-[#ff8533]',
    green: 'from-green-500 to-green-400',
    blue: 'from-blue-500 to-blue-400',
  }

  return (
    <div className={className}>
      <div className="h-3 bg-[#393941] rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}
