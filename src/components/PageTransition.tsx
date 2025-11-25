import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useJubeeStore } from '@/store/useJubeeStore';
import { useJubeePageTransition } from '@/hooks/useJubeePageTransition';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const { triggerAnimation } = useJubeeStore();
  const prefersReducedMotion = useReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);

  // Animate Jubee flying across screen during transitions
  useJubeePageTransition();

  useEffect(() => {
    // Trigger Jubee's transition animation when page changes
    triggerAnimation('pageTransition');
    setDisplayLocation(location);
  }, [location.pathname, triggerAnimation, location]);

  // Respect user's motion preferences
  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.98 },
      };

  const transition = prefersReducedMotion
    ? { duration: 0.15 }
    : {
        duration: 0.4,
        ease: 'easeInOut' as const, // Use string constant instead of array
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={displayLocation.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
