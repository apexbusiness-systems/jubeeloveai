import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useTranslatedContent } from '@/i18n/useTranslatedContent'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, ArrowLeft, Sparkles, Hand, BookOpen, Shapes, Pen, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'

const tutorialSteps = [
  {
    id: 'welcome',
    icon: Sparkles,
    highlightSelector: '.jubee-container',
    position: 'center' as const,
  },
  {
    id: 'jubee-interaction',
    icon: Hand,
    highlightSelector: '.jubee-container',
    position: 'bottom' as const,
  },
  {
    id: 'writing-practice',
    icon: Pen,
    highlightSelector: '[href="/write"]',
    position: 'right' as const,
  },
  {
    id: 'shapes-game',
    icon: Shapes,
    highlightSelector: '[href="/shapes"]',
    position: 'right' as const,
  },
  {
    id: 'reading-stories',
    icon: BookOpen,
    highlightSelector: '[href="/progress"]',
    position: 'right' as const,
  },
  {
    id: 'collect-stickers',
    icon: Star,
    highlightSelector: '[href="/stickers"]',
    position: 'right' as const,
  },
]

export function OnboardingTutorial() {
  const { isActive, currentStep, nextStep, previousStep, completeOnboarding, skipOnboarding } = useOnboardingStore()
  const { t } = useTranslatedContent()
  const highlightRef = useRef<HTMLDivElement>(null)

  const currentTutorialStep = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1
  const isFirstStep = currentStep === 0

  useEffect(() => {
    if (!isActive || !currentTutorialStep) return

    const updateHighlight = () => {
      if (currentTutorialStep.highlightSelector) {
        const element = document.querySelector(currentTutorialStep.highlightSelector)
        if (element && highlightRef.current) {
          const rect = element.getBoundingClientRect()
          highlightRef.current.style.top = `${rect.top - 8}px`
          highlightRef.current.style.left = `${rect.left - 8}px`
          highlightRef.current.style.width = `${rect.width + 16}px`
          highlightRef.current.style.height = `${rect.height + 16}px`
        }
      }
    }

    updateHighlight()
    window.addEventListener('resize', updateHighlight)
    const interval = setInterval(updateHighlight, 100)

    return () => {
      window.removeEventListener('resize', updateHighlight)
      clearInterval(interval)
    }
  }, [isActive, currentStep, currentTutorialStep])

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding()
    } else {
      nextStep()
    }
  }

  const getTooltipPosition = () => {
    if (!currentTutorialStep) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const element = document.querySelector(currentTutorialStep.highlightSelector)
    if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const rect = element.getBoundingClientRect()
    const position = currentTutorialStep.position

    switch (position) {
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 24}px`,
          transform: 'translateY(-50%)',
        }
      case 'bottom':
        return {
          top: `${rect.bottom + 24}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        }
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
    }
  }

  if (!isActive) return null

  const Icon = currentTutorialStep?.icon || Sparkles

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
          onClick={skipOnboarding}
        />

        {/* Highlight circle */}
        {currentTutorialStep?.highlightSelector && (
          <motion.div
            ref={highlightRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute rounded-2xl pointer-events-none"
            style={{
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px 4px hsl(var(--primary) / 0.5)',
              border: '3px solid hsl(var(--primary))',
              transition: 'all 0.3s ease-out',
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute pointer-events-auto"
          style={getTooltipPosition()}
        >
          <Card className="w-[90vw] max-w-md p-6 shadow-2xl border-2 border-primary/20 bg-card">
            {/* Close button */}
            <button
              onClick={skipOnboarding}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close tutorial"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
            >
              <Icon className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Content */}
            <h3 className="text-xl font-bold mb-2 text-foreground">
              {t(`onboarding.${currentTutorialStep?.id}.title`)}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t(`onboarding.${currentTutorialStep?.id}.description`)}
            </p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {tutorialSteps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={false}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1,
                    backgroundColor: index === currentStep 
                      ? 'hsl(var(--primary))' 
                      : 'hsl(var(--muted))',
                  }}
                  className="w-2 h-2 rounded-full"
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={previousStep}
                disabled={isFirstStep}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('common.back')}
              </Button>

              <Button
                onClick={handleNext}
                className="gap-2 min-w-[120px]"
              >
                {isLastStep ? t('onboarding.getStarted') : t('common.next')}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>

            {/* Skip option */}
            <button
              onClick={skipOnboarding}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('onboarding.skip')}
            </button>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
