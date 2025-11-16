/**
 * Jubee Container - Unified wrapper for all Jubee functionality
 * Handles positioning, dragging, collision detection, and health monitoring
 */

import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { JubeeMascot } from './JubeeMascot'
import { useJubeeStore } from '@/store/useJubeeStore'
import { useJubee } from '@/hooks/useJubee'
import { useJubeeConfiguration } from '@/hooks/useJubeeConfiguration'

export function JubeeContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { containerPosition, isVisible, position, currentAnimation } = useJubeeStore()
  const { features, safeMode } = useJubeeConfiguration()
  
  // Early return if not visible to prevent unnecessary hook calls
  if (!isVisible) return null
  
  const { isDragging, healthStatus } = useJubee(containerRef, {
    enableDragging: features.draggable && !safeMode,
    enableCollisionDetection: features.collisionDetection && !safeMode,
    enableHealthMonitoring: features.autoRecovery,
  })

  return (
    <div
      ref={containerRef}
      className="jubee-container fixed z-50"
      style={{
        bottom: `${containerPosition.bottom}px`,
        right: `${containerPosition.right}px`,
        width: '400px',
        height: '450px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        opacity: healthStatus === 'critical' ? 0.7 : 1,
        transition: isDragging ? 'none' : 'opacity 0.3s ease',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <JubeeMascot position={[position.x, position.y, position.z]} animation={currentAnimation} />
      </Canvas>
    </div>
  )
}
