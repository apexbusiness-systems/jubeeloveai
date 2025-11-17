import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useJubeeStore } from '@/store/useJubeeStore'
import { useTranslatedContent } from '@/i18n/useTranslatedContent'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, ArrowLeft, Sparkles, Hand, BookOpen, Shapes, Pen, Star, PartyPopper } from 'lucide-react'
import { Card } from '@/components/ui/card'
import confetti from 'canvas-confetti'

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
  const { interactionCount } = useJubeeStore()
  const { t } = useTranslatedContent()
  const highlightRef = useRef<HTMLDivElement>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const currentTutorialStep = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1
  const isFirstStep = currentStep === 0

  // Auto-complete onboarding after first Jubee interaction
  useEffect(() => {
    if (isActive && interactionCount > 0) {
      console.log('[Onboarding] Auto-completing after first Jubee interaction')
      setShowCelebration(true)
      
      // Trigger confetti
      const duration = 2500
      const end = Date.now() + duration
      
      const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))']
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        })
        
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      
      frame()
      
      // Hide celebration message and complete onboarding
      const timer = setTimeout(() => {
        setShowCelebration(false)
        completeOnboarding()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isActive, interactionCount, completeOnboarding])

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
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024

    // On mobile, always center the tooltip for best UX
    if (isMobile) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    // On tablet, use bottom position for better space utilization
    if (isTablet && position === 'right') {
      return {
        top: `${rect.bottom + 24}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'calc(100vw - 32px)',
      }
    }

    switch (position) {
      case 'right':
        // Ensure card doesn't overflow viewport
        const cardWidth = 448 // max-w-md = 28rem = 448px
        const spaceOnRight = window.innerWidth - rect.right
        if (spaceOnRight < cardWidth + 48) {
          // Not enough space on right, use bottom instead
          return {
            top: `${rect.bottom + 24}px`,
            left: '50%',
            transform: 'translateX(-50%)',
          }
        }
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 24}px`,
          transform: 'translateY(-50%)',
        }
      case 'bottom':
        return {
          top: `${rect.bottom + 24}px`,
          left: '50%',
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

  if (!isActive && !showCelebration) return null

  const Icon = currentTutorialStep?.icon || Sparkles

  return (
    <AnimatePresence>
      {/* Celebration overlay */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/50 backdrop-blur-sm pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-center px-4 sm:px-8 max-w-lg mx-auto"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
              className="inline-block mb-4"
            >
              <PartyPopper className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-primary" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2"
            >
              {t('onboarding.celebration.title') || 'Great Job!'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground px-2"
            >
              {t('onboarding.celebration.message') || 'You\'re all set! Have fun exploring!'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
      
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
          className="absolute pointer-events-auto max-w-[calc(100vw-2rem)] sm:max-w-md mx-4 sm:mx-0"
          style={getTooltipPosition()}
        >
          <Card className="w-full p-4 sm:p-6 shadow-2xl border-2 border-primary/20 bg-card">
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
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4"
            >
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </motion.div>

            {/* Content */}
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground pr-8">
              {t(`onboarding.${currentTutorialStep?.id}.title`)}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
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
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <Button
                variant="ghost"
                onClick={previousStep}
                disabled={isFirstStep}
                className="gap-1 sm:gap-2 text-sm sm:text-base"
                size="sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('common.back')}</span>
                <span className="sm:hidden">Back</span>
              </Button>

              <Button
                onClick={handleNext}
                className="gap-1 sm:gap-2 min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
                size="sm"
              >
                {isLastStep ? t('onboarding.getStarted') : t('common.next')}
                {!isLastStep && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />}
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
