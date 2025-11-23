import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
  const prefersReducedMotion = useReducedMotion()

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
    if (!currentTutorialStep) return {}

    const element = document.querySelector(currentTutorialStep.highlightSelector)
    if (!element) return {}

    const isMobile = window.innerWidth < 768
    
    // Mobile: always bottom-aligned for safety
    if (isMobile) {
      return {}
    }

    // Tablet+: use intelligent positioning
    const rect = element.getBoundingClientRect()
    const position = currentTutorialStep.position
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024

    if (isTablet && position === 'right') {
      return {
        top: `${Math.min(rect.bottom + 24, window.innerHeight - 400)}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      }
    }

    switch (position) {
      case 'right': {
        const cardWidth = 480
        const spaceOnRight = window.innerWidth - rect.right
        if (spaceOnRight < cardWidth + 48) {
          return {
            top: `${Math.min(rect.bottom + 24, window.innerHeight - 400)}px`,
            left: '50%',
            transform: 'translateX(-50%)',
          }
        }
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 24}px`,
          transform: 'translateY(-50%)',
        }
      }
      case 'bottom':
        return {
          top: `${Math.min(rect.bottom + 24, window.innerHeight - 400)}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        }
      case 'center':
      default:
        return {}
    }
  }

  if (!isActive && !showCelebration) return null

  const Icon = currentTutorialStep?.icon || Sparkles

  const animationDuration = prefersReducedMotion ? 0.01 : 0.25

  return (
    <AnimatePresence>
      {/* Celebration overlay */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationDuration }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-auto"
          style={{
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{ 
              type: prefersReducedMotion ? 'tween' : 'spring', 
              stiffness: 300, 
              damping: 20,
              duration: animationDuration * 2
            }}
            className="text-center px-4 sm:px-8 max-w-lg mx-auto"
          >
            <motion.div
              animate={prefersReducedMotion ? {} : {
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
              transition={{ delay: animationDuration, duration: animationDuration }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight"
            >
              {t('onboarding.celebration.title') || 'Great Job!'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animationDuration * 1.5, duration: animationDuration }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground px-2 leading-relaxed"
            >
              {t('onboarding.celebration.message') || 'You\'re all set! Have fun exploring!'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
      
      {/* Main onboarding overlay - Mobile optimized */}
      <div 
        className="fixed inset-0 z-[9999] pointer-events-none md:flex md:items-center md:justify-center"
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationDuration }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
          onClick={skipOnboarding}
          aria-label="Close onboarding"
        />

        {/* Highlight ring around target element (desktop only) */}
        {currentTutorialStep?.highlightSelector && window.innerWidth >= 768 && (
          <motion.div
            ref={highlightRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: animationDuration }}
            className="absolute rounded-2xl pointer-events-none hidden md:block"
            style={{
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px 4px hsl(var(--primary) / 0.5)',
              border: '3px solid hsl(var(--primary))',
              transition: `all ${animationDuration}s ease-out`,
            }}
          />
        )}

        {/* Onboarding card - responsive positioning */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ 
            duration: animationDuration, 
            type: prefersReducedMotion ? 'tween' : 'spring', 
            stiffness: 300, 
            damping: 25 
          }}
          className="
            pointer-events-auto
            fixed md:absolute
            bottom-0 md:bottom-auto
            left-0 md:left-auto
            right-0 md:right-auto
            w-full md:w-auto
            max-w-full md:max-w-[480px] lg:max-w-[560px]
            mx-0 md:mx-4
            mb-0 md:mb-0
            max-h-[70vh] md:max-h-[80vh]
          "
          style={getTooltipPosition()}
        >
          <Card className="
            w-full
            bg-card
            border-t-2 md:border-2
            border-primary/30
            md:rounded-3xl
            rounded-t-3xl rounded-b-none md:rounded-b-3xl
            shadow-2xl
            overflow-hidden
          ">
            {/* Scrollable content area */}
            <div className="
              overflow-y-auto 
              overscroll-contain
              max-h-[70vh] md:max-h-[75vh]
              p-5 sm:p-6 md:p-8
            ">
              {/* Close button - touch friendly */}
              <button
                onClick={skipOnboarding}
                className="
                  absolute top-4 right-4 z-10
                  w-11 h-11
                  flex items-center justify-center
                  rounded-full 
                  bg-muted/50 hover:bg-muted
                  transition-colors duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                "
                aria-label="Close tutorial"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Icon with accent background */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: animationDuration, 
                  type: prefersReducedMotion ? 'tween' : 'spring', 
                  stiffness: 400, 
                  damping: 15,
                  duration: animationDuration
                }}
                className="
                  w-16 h-16 sm:w-20 sm:h-20
                  rounded-2xl
                  bg-primary/10
                  flex items-center justify-center
                  mb-4 sm:mb-5
                "
              >
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </motion.div>

              {/* Title */}
              <h3 className="
                text-xl sm:text-2xl md:text-3xl
                font-bold
                mb-3 sm:mb-4
                text-foreground
                pr-12
                leading-tight
              ">
                {t(`onboarding.${currentTutorialStep?.id}.title`)}
              </h3>

              {/* Description */}
              <p className="
                text-base sm:text-lg
                text-muted-foreground
                mb-6 sm:mb-8
                leading-relaxed
                pr-4
              ">
                {t(`onboarding.${currentTutorialStep?.id}.description`)}
              </p>

              {/* Progress dots - touch friendly sizing */}
              <div className="flex items-center justify-center gap-2.5 mb-6 sm:mb-8">
                {tutorialSteps.map((_, index) => (
                  <motion.button
                    key={index}
                    initial={false}
                    animate={{
                      scale: index === currentStep ? 1.3 : 1,
                      backgroundColor: index === currentStep 
                        ? 'hsl(var(--primary))' 
                        : 'hsl(var(--muted))',
                    }}
                    className="
                      w-3 h-3
                      rounded-full
                      transition-all duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    "
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      // Allow direct navigation to visited steps
                      if (index < currentStep) {
                        while (currentStep > index) previousStep()
                      }
                    }}
                    disabled={index > currentStep}
                    aria-label={`Step ${index + 1} of ${tutorialSteps.length}`}
                    aria-current={index === currentStep ? 'step' : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Fixed navigation footer */}
            <div className="
              border-t border-border
              bg-card
              p-4 sm:p-5 md:p-6
            ">
              {/* Navigation buttons - full width on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={previousStep}
                  disabled={isFirstStep}
                  className="
                    gap-2
                    h-12 sm:h-11
                    text-base sm:text-sm
                    flex-1 sm:flex-initial
                    min-w-[120px]
                    focus-visible:ring-2 focus-visible:ring-primary
                  "
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('common.back') || 'Back'}</span>
                </Button>

                <Button
                  onClick={handleNext}
                  className="
                    gap-2
                    h-12 sm:h-11
                    text-base sm:text-sm
                    flex-1
                    min-w-[140px]
                    bg-primary hover:bg-primary/90
                    focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  "
                >
                  <span>{isLastStep ? (t('onboarding.getStarted') || 'Get Started') : (t('common.next') || 'Next')}</span>
                  {!isLastStep && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>

              {/* Skip option - touch friendly */}
              <button
                onClick={skipOnboarding}
                className="
                  w-full
                  mt-4
                  h-11
                  text-sm sm:text-base
                  text-muted-foreground hover:text-foreground
                  transition-colors duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  rounded-lg
                "
              >
                {t('onboarding.skip') || 'Skip tutorial'}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
