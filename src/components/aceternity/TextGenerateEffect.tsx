'use client'

import { Fragment } from 'react'
import { motion, cubicBezier } from 'motion/react'
import { cn } from '@/lib/utils'

export default function TextGenerateEffect({
  words,
  className,
  animation = true,
  duration = 0.8
}: {
  words: string
  className?: string
  animation?: boolean
  duration?: number
}) {
  const processText = (text: string) => {
    return text.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n')
  }

  const processedText = processText(words)
  const segments = processedText.split('\n')

  const initial = animation
    ? {
        opacity: 0,
        y: '100%'
      }
    : {
        opacity: 1
      }

  const animate = {
    opacity: 1,
    y: 0
  }

  const renderWords = () => {
    let wordIndex = 0

    return (
      <>
        {segments.map((segment, segmentIndex) => {
          const wordsInSegment = segment
            .trim()
            .split(' ')
            .filter((word) => word.length > 0)

          return (
            <div
              key={segmentIndex.toString()}
              className="overflow-hidden"
            >
              {wordsInSegment.map((word, index) => {
                const currentWordIndex = wordIndex++
                const isLastWordInSegment = index === wordsInSegment.length - 1
                return (
                  <Fragment key={`${segmentIndex}-${word}-${index}`}>
                    <span className="inline-block">
                      <motion.span
                        className="inline-block opacity-0"
                        initial={initial}
                        animate={
                          animation
                            ? {
                                ...animate,
                                transition: {
                                  duration: duration,
                                  delay: currentWordIndex * 0.08,
                                  ease: cubicBezier(0.85, 0, 0.15, 1)
                                }
                              }
                            : false
                        }
                      >
                        {word}
                      </motion.span>
                    </span>
                    {!isLastWordInSegment && <span className="inline-block">&nbsp;</span>}
                  </Fragment>
                )
              })}
              {segmentIndex < segments.length - 1 && <br />}
            </div>
          )
        })}
      </>
    )
  }

  return <div className={cn('text-2xl font-medium', className)}>{renderWords()}</div>
}
