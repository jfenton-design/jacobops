import { scoreBg } from '@/lib/utils'
import clsx from 'clsx'

interface Props {
  letter: string
  total: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ letter, total, size = 'md' }: Props) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-xl',
  }
  return (
    <div
      className={clsx(
        'rounded-lg border flex flex-col items-center justify-center font-mono font-bold shrink-0',
        sizes[size],
        scoreBg(letter)
      )}
      title={`Score: ${total}/100`}
    >
      {letter}
    </div>
  )
}
