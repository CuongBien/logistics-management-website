'use client'

import { cn } from '@/lib/utils'
import { Check, type LucideIcon } from 'lucide-react'

interface StepConfig {
  title: string
  description: string
  icon: LucideIcon
}

interface OrderStepperProps {
  steps: StepConfig[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function OrderStepper({
  steps,
  currentStep,
  onStepClick,
}: OrderStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isActive = stepNumber === currentStep
          const isPending = stepNumber > currentStep
          const isLast = index === steps.length - 1

          return (
            <div
              key={step.title}
              className={cn(
                'flex flex-1 items-start',
                isLast && 'flex-none',
              )}
            >
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepClick?.(stepNumber)}
                  disabled={!onStepClick}
                  className={cn(
                    'relative z-10 flex size-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all duration-500',
                    isCompleted &&
                      'border-green-500 bg-green-500 text-white shadow-md shadow-green-500/25',
                    isActive &&
                      'scale-110 border-transparent bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/30',
                    isPending &&
                      'border-muted-foreground/30 bg-background text-muted-foreground',
                    onStepClick &&
                      'cursor-pointer hover:shadow-md',
                    !onStepClick && 'cursor-default',
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </button>

                {/* Labels below circle */}
                <div className="mt-3 flex flex-col items-center text-center">
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors duration-300 sm:text-sm',
                      isActive && 'text-blue-600 dark:text-blue-400',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isPending && 'text-muted-foreground',
                    )}
                  >
                    {step.title}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 hidden text-xs text-muted-foreground/70 sm:block',
                      isActive && 'text-muted-foreground',
                    )}
                  >
                    {step.description}
                  </span>
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="relative mt-5 flex h-px flex-1 items-center mx-2">
                  {/* Background line */}
                  <div className="absolute inset-0 bg-border" />
                  {/* Progress line */}
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 h-px transition-all duration-500',
                      isCompleted
                        ? 'w-full bg-gradient-to-r from-green-500 to-green-500'
                        : isActive
                          ? 'w-1/2 bg-gradient-to-r from-blue-600 to-violet-600'
                          : 'w-0',
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
