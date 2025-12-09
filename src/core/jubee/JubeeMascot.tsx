/**
 * JubeeMascot 3D Component
 * 
 * The core 3D animated mascot for Jubee Love.
 * Optimized for 60fps performance with efficient Three.js rendering.
 * 
 * Performance optimizations:
 * - Memoized constants and color values
 * - Reusable Three.js vector objects
 * - Efficient geometry with appropriate segment counts
 * - Conditional rendering for speech bubbles
 * 
 * @component
 */

import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Text, Sparkles } from '@react-three/drei'
import { useSpring, a, config } from '@react-spring/three'
import { Group, Mesh } from 'three'
import { useJubeeStore } from '../../store/useJubeeStore'
import * as THREE from 'three'

interface PerformanceProfile {
  quality: 'low' | 'medium' | 'high'
  targetFPS: number
  shadowsEnabled: boolean
  particlesEnabled: boolean
  geometrySegments: number
  animationThrottle: number
}

interface JubeeProps {
  position?: [number, number, number]
  animation?: string
  performanceProfile?: PerformanceProfile
}

// Constants moved outside component for performance
const GREETINGS = [
  "Buzz buzz! Hello!",
  "Let's learn together!",
  "You're doing great!",
  "I'm so happy to see you!",
  "Ready for an adventure?"
] as const

// Function to get CSS variable color value
const getColorValue = (varName: string): string => {
  if (typeof window === 'undefined') return '#FFD700'
  const root = document.documentElement
  const value = getComputedStyle(root).getPropertyValue(varName).trim()
  if (!value) return '#FFD700'
  // Convert HSL to hex-like string for Three.js
  const [h, s, l] = value.split(' ').map(v => parseFloat(v))
  return `hsl(${h}, ${s}%, ${l}%)`
}

// Get colors from design system
const getJubeeColors = (gender: 'male' | 'female') => ({
  body: getColorValue('--jubee-body'),
  bodyGlow: getColorValue('--jubee-body-glow'),
  stripe: getColorValue('--jubee-stripe'),
  accent: gender === 'male' 
    ? getColorValue('--jubee-boy-accent') 
    : getColorValue('--jubee-girl-accent'),
  accentDark: gender === 'male'
    ? getColorValue('--jubee-boy-accent-dark')
    : getColorValue('--jubee-girl-accent-dark'),
  eyeWhite: getColorValue('--jubee-eye-white'),
  eyePupil: getColorValue('--jubee-eye-pupil'),
  cheek: getColorValue('--jubee-cheek'),
  wing: getColorValue('--jubee-wing'),
  wingGlow: getColorValue('--jubee-wing-glow')
})

// Reusable vectors for performance
const tempVector = new THREE.Vector3()
const targetScale = new THREE.Vector3()

export function JubeeMascot({ position = [0, 0, 0], animation = 'idle', performanceProfile }: JubeeProps) {
  const group = useRef<Group>(null)
  const bodyRef = useRef<Mesh>(null)
  const headRef = useRef<Mesh>(null)
  const leftWingRef = useRef<Mesh>(null)
  const rightWingRef = useRef<Mesh>(null)
  const leftEyeRef = useRef<Mesh>(null)
  const rightEyeRef = useRef<Mesh>(null)
  const leftAntennaRef = useRef<Mesh>(null)
  const rightAntennaRef = useRef<Mesh>(null)
  const { camera } = useThree()
  const [isHovered, setIsHovered] = useState(false)
  const [blinkTime, setBlinkTime] = useState(0)
  const [showClickFeedback, setShowClickFeedback] = useState(false)
  const { gender, speechText, currentMood, updatePosition, speak, triggerAnimation, cleanup } = useJubeeStore()

  // Memoize current colors and performance settings from design system
  const currentColors = useMemo(() => getJubeeColors(gender), [gender])
  const segments = performanceProfile?.geometrySegments || 32 // Adaptive geometry quality
  
  // Dynamic facial expressions based on mood
  const faceExpression = useMemo(() => {
    const expressions = {
      happy: {
        eyeScale: 1.0,
        eyeY: 0.08,
        pupilSize: 0.07,
        smileArc: Math.PI,
        smileY: 0.55,
        smileRotation: Math.PI / 2,
        smileRadius: 0.12,
        cheekOpacity: 0.7,
        antennaWave: 0.15
      },
      excited: {
        eyeScale: 1.3,
        eyeY: 0.1,
        pupilSize: 0.08,
        smileArc: Math.PI * 1.2,
        smileY: 0.53,
        smileRotation: Math.PI / 2,
        smileRadius: 0.15,
        cheekOpacity: 0.9,
        antennaWave: 0.3
      },
      frustrated: {
        eyeScale: 0.8,
        eyeY: 0.05,
        pupilSize: 0.06,
        smileArc: Math.PI,
        smileY: 0.5,
        smileRotation: -Math.PI / 2,
        smileRadius: 0.1,
        cheekOpacity: 0.4,
        antennaWave: 0.05
      },
      curious: {
        eyeScale: 1.1,
        eyeY: 0.1,
        pupilSize: 0.075,
        smileArc: Math.PI * 0.7,
        smileY: 0.54,
        smileRotation: Math.PI / 2,
        smileRadius: 0.1,
        cheekOpacity: 0.6,
        antennaWave: 0.2
      },
      tired: {
        eyeScale: 0.7,
        eyeY: 0.05,
        pupilSize: 0.05,
        smileArc: Math.PI * 0.5,
        smileY: 0.52,
        smileRotation: Math.PI / 2,
        smileRadius: 0.08,
        cheekOpacity: 0.3,
        antennaWave: 0.02
      }
    }
    return expressions[currentMood] || expressions.happy
  }, [currentMood])
  
  // Spring physics for scale animations - bouncy click feedback
  const [{ scale }, springApi] = useSpring(() => ({
    scale: 1,
    config: {
      tension: 300,
      friction: 10,
      mass: 0.5
    }
  }))

  // Spring physics for hover effect
  const [{ hoverScale }, hoverSpringApi] = useSpring(() => ({
    hoverScale: 1,
    config: config.wobbly
  }))
  
  // Spring physics for facial expression transitions
  const [expressionSpring, expressionApi] = useSpring(() => ({
    eyeScale: faceExpression.eyeScale,
    eyeY: faceExpression.eyeY,
    smileY: faceExpression.smileY,
    smileRotation: faceExpression.smileRotation,
    cheekOpacity: faceExpression.cheekOpacity,
    config: { tension: 120, friction: 14 }
  }))
  
  // Update expression spring when mood changes
  useEffect(() => {
    expressionApi.start({
      eyeScale: faceExpression.eyeScale,
      eyeY: faceExpression.eyeY,
      smileY: faceExpression.smileY,
      smileRotation: faceExpression.smileRotation,
      cheekOpacity: faceExpression.cheekOpacity
    })
  }, [currentMood, faceExpression, expressionApi])
  
  // Mount/unmount logging
  useEffect(() => {
    console.log('[Jubee] JubeeMascot mounted')
    return () => {
      console.log('[Jubee] JubeeMascot unmounting')
      cleanup()
    }
  }, [cleanup])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
    speak(randomGreeting)
    triggerAnimation('celebrate')
    
    // Bouncy spring animation on click
    springApi.start({
      scale: 1.3,
      config: {
        tension: 400,
        friction: 8
      }
    })
    setTimeout(() => {
      springApi.start({
        scale: 1,
        config: {
          tension: 300,
          friction: 10
        }
      })
    }, 150)
    
    // Show click feedback tooltip
    setShowClickFeedback(true)
    setTimeout(() => setShowClickFeedback(false), 2000)
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
    // Spring hover effect
    hoverSpringApi.start({
      hoverScale: 1.1,
      config: config.wobbly
    })
  }

  const handlePointerOut = () => {
    setIsHovered(false)
    document.body.style.cursor = 'default'
    // Spring back to normal
    hoverSpringApi.start({
      hoverScale: 1,
      config: config.gentle
    })
  }

  useFrame((state) => {
    if (!group.current) return

    try {
      const time = state.clock.elapsedTime
      
      // Frame skip for performance on low-end devices
      const shouldSkipFrame = performanceProfile?.quality === 'low' && state.frameloop !== 'never'
      if (shouldSkipFrame && Math.floor(time * 60) % 2 === 0) return
    
    // Blinking animation - blink every 3-5 seconds
    if (time - blinkTime > 3 + Math.random() * 2) {
      setBlinkTime(time)
    }
    const isBlinking = time - blinkTime < 0.15
    
    // Eye blink scale
    if (leftEyeRef.current && rightEyeRef.current) {
      const blinkScale = isBlinking ? 0.1 : 1
      leftEyeRef.current.scale.y = blinkScale
      rightEyeRef.current.scale.y = blinkScale
    }

    // Look at camera
    group.current.lookAt(camera.position)

    // Page transition animation - Jubee flies across screen
    if (animation === 'pageTransition') {
      const transitionProgress = (time % 1.2) / 1.2 // 1.2 second cycle
      const flyX = Math.sin(transitionProgress * Math.PI * 2) * 4 // Fly across screen (reduced range)
      const flyY = position[1] + Math.sin(transitionProgress * Math.PI) * 1.5 // Arc motion (reduced)
      group.current.position.x = flyX
      group.current.position.y = flyY
      group.current.position.z = position[2]
      
      // Spin while flying
      group.current.rotation.y = transitionProgress * Math.PI * 4
    } else {
      // Normal hovering motion - constrained to visible area
      const baseY = position[1]
      const hoverSpeed = animation === 'excited' ? 3 : 2
      const hoverAmount = animation === 'excited' ? 0.15 : 0.08 // Reduced movement
      const newY = baseY + Math.sin(time * hoverSpeed) * hoverAmount
      
      // Clamp Y position to prevent going off-screen (keep antenna visible)
      group.current.position.y = Math.max(-3, Math.min(1, newY))
      group.current.position.x = position[0]
      group.current.position.z = position[2]
    }

    // Update position in store (with error handling)
    try {
      if (group.current && group.current.position) {
        updatePosition(group.current.position)
      }
    } catch (error) {
      console.error('[Jubee] Error updating position:', error)
    }

    // Breathing animation - body scale
    if (bodyRef.current) {
      const breathe = 1 + Math.sin(time * 1.2) * 0.03
      bodyRef.current.scale.set(breathe, breathe, breathe)
      bodyRef.current.rotation.z = Math.sin(time * 1.5) * 0.05
    }

    // Head tilt and breathing
    if (headRef.current) {
      const breathe = 1 + Math.sin(time * 1.2) * 0.02
      headRef.current.scale.set(breathe, breathe, breathe)
      headRef.current.rotation.x = Math.sin(time * 2) * 0.12
      headRef.current.rotation.z = Math.sin(time * 1.5) * 0.1
    }

    // Wing flapping - smoother with easing and faster during page transition
    const wingSpeed = animation === 'pageTransition' ? 25 : animation === 'excited' ? 15 : animation === 'celebrate' ? 20 : 8
    const targetFlapLeft = Math.sin(time * wingSpeed) * 0.5 + 0.3
    const targetFlapRight = -Math.sin(time * wingSpeed) * 0.5 - 0.3
    
    if (leftWingRef.current) {
      // Smooth interpolation for natural wing movement
      leftWingRef.current.rotation.y += (targetFlapLeft - leftWingRef.current.rotation.y) * 0.3
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.y += (targetFlapRight - rightWingRef.current.rotation.y) * 0.3
    }
    
    // Mood-based antenna animation
    if (leftAntennaRef.current && rightAntennaRef.current) {
      const antennaWave = faceExpression.antennaWave
      const antennaSpeed = currentMood === 'excited' ? 4 : currentMood === 'tired' ? 0.5 : 2
      
      // Left antenna sways
      leftAntennaRef.current.rotation.z = Math.sin(time * antennaSpeed) * antennaWave
      leftAntennaRef.current.rotation.x = Math.cos(time * antennaSpeed * 0.7) * antennaWave * 0.5
      
      // Right antenna sways (opposite phase)
      rightAntennaRef.current.rotation.z = -Math.sin(time * antennaSpeed) * antennaWave
      rightAntennaRef.current.rotation.x = Math.cos(time * antennaSpeed * 0.7) * antennaWave * 0.5
    }

    // Celebration spin
    if (animation === 'celebrate') {
      group.current.rotation.y = time * 2
    } else if (animation !== 'pageTransition') {
      group.current.rotation.y = 0
    }
    } catch (error) {
      console.error('[Jubee] Error in useFrame:', error)
      // Continue with minimal safe operations
    }
  })

  return (
    <a.group
      ref={group}
      position={position}
      scale={scale.to(s => [s * hoverScale.get(), s * hoverScale.get(), s * hoverScale.get()] as const)}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Hover indicator ring */}
      {isHovered && (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshBasicMaterial color={currentColors.accent} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Body - large sphere */}
      <mesh ref={bodyRef} position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.5, segments, segments]} />
        <meshStandardMaterial
          color={currentColors.body}
          roughness={0.2}
          metalness={0.4}
          emissive={currentColors.bodyGlow}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Black stripes on body */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.51, segments, segments, 0, Math.PI * 2, 0.7, 0.3]} />
        <meshStandardMaterial 
          color={currentColors.stripe}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.15, 0]} castShadow>
        <sphereGeometry args={[0.51, segments, segments, 0, Math.PI * 2, 1.3, 0.3]} />
        <meshStandardMaterial 
          color={currentColors.stripe}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Accent stripe (gender-specific color) */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <sphereGeometry args={[0.52, segments, segments, 0, Math.PI * 2, 1.6, 0.2]} />
        <meshStandardMaterial 
          color={currentColors.accentDark}
          roughness={0.2}
          metalness={0.5}
          emissive={currentColors.accent}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Head - medium sphere */}
      <mesh ref={headRef} position={[0, 0.65, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.35, segments, segments]} />
        <meshStandardMaterial
          color={currentColors.body}
          roughness={0.2}
          metalness={0.4}
          emissive={currentColors.bodyGlow}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Eyes - large and expressive with blinking */}
      <group position={[0, 0.65, 0]}>
        {/* Left eye white */}
        <a.mesh 
          ref={leftEyeRef} 
          position={[-0.15, expressionSpring.eyeY, 0.28]} 
          scale={expressionSpring.eyeScale.to(s => [s, s, s] as const)}
          castShadow
        >
          <sphereGeometry args={[0.13, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyeWhite}
            roughness={0.1}
            metalness={0.1}
          />
        </a.mesh>
        {/* Left pupil */}
        <a.mesh 
          position-x={-0.15}
          position-y={expressionSpring.eyeY}
          position-z={0.38}
          castShadow
        >
          <sphereGeometry args={[faceExpression.pupilSize, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyePupil}
            roughness={0.8}
          />
        </a.mesh>
        {/* Left eye shine - multiple for sparkle effect */}
        <a.mesh 
          position-x={-0.13}
          position-y={expressionSpring.eyeY.to(y => y + 0.05)}
          position-z={0.43}
          castShadow
        >
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} />
        </a.mesh>
        <a.mesh 
          position-x={-0.16}
          position-y={expressionSpring.eyeY.to(y => y + 0.02)}
          position-z={0.42}
          castShadow
        >
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} transparent opacity={0.7} />
        </a.mesh>

        {/* Right eye white */}
        <a.mesh 
          ref={rightEyeRef} 
          position={[0.15, expressionSpring.eyeY, 0.28]} 
          scale={expressionSpring.eyeScale.to(s => [s, s, s] as const)}
          castShadow
        >
          <sphereGeometry args={[0.13, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyeWhite}
            roughness={0.1}
            metalness={0.1}
          />
        </a.mesh>
        {/* Right pupil */}
        <a.mesh 
          position-x={0.15}
          position-y={expressionSpring.eyeY}
          position-z={0.38}
          castShadow
        >
          <sphereGeometry args={[faceExpression.pupilSize, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyePupil}
            roughness={0.8}
          />
        </a.mesh>
        {/* Right eye shine - multiple for sparkle effect */}
        <a.mesh 
          position-x={0.17}
          position-y={expressionSpring.eyeY.to(y => y + 0.05)}
          position-z={0.43}
          castShadow
        >
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} />
        </a.mesh>
        <a.mesh 
          position-x={0.14}
          position-y={expressionSpring.eyeY.to(y => y + 0.02)}
          position-z={0.42}
          castShadow
        >
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} transparent opacity={0.7} />
        </a.mesh>
      </group>

      {/* Smile - dynamic shape based on mood */}
      <a.mesh 
        position-x={0}
        position-y={expressionSpring.smileY}
        position-z={0.3}
        rotation-x={expressionSpring.smileRotation}
        rotation-y={0}
        rotation-z={0}
        castShadow
      >
        <torusGeometry args={[faceExpression.smileRadius, 0.02, 16, 48, faceExpression.smileArc]} />
        <meshStandardMaterial 
          color={currentColors.eyePupil}
          roughness={0.5}
        />
      </a.mesh>

      {/* Rosy cheeks - dynamic opacity */}
      <a.mesh position={[-0.28, 0.58, 0.15]} castShadow>
        <sphereGeometry args={[0.08, 32, 32]} />
        <a.meshStandardMaterial 
          color={currentColors.cheek} 
          transparent 
          opacity={expressionSpring.cheekOpacity}
          roughness={0.3}
        />
      </a.mesh>
      <a.mesh position={[0.28, 0.58, 0.15]} castShadow>
        <sphereGeometry args={[0.08, 32, 32]} />
        <a.meshStandardMaterial 
          color={currentColors.cheek} 
          transparent 
          opacity={expressionSpring.cheekOpacity}
          roughness={0.3}
        />
      </a.mesh>

      {/* Antennae - mood-responsive movement */}
      <group>
        {/* Left antenna */}
        <mesh ref={leftAntennaRef} position={[-0.15, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
          <meshStandardMaterial 
            color={currentColors.stripe}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[-0.15, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshStandardMaterial
            color={currentColors.accent}
            emissive={currentColors.accent}
            emissiveIntensity={currentMood === 'excited' ? 1.0 : 0.7}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        {/* Right antenna */}
        <mesh ref={rightAntennaRef} position={[0.15, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
          <meshStandardMaterial 
            color={currentColors.stripe}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0.15, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshStandardMaterial
            color={currentColors.accent}
            emissive={currentColors.accent}
            emissiveIntensity={currentMood === 'excited' ? 1.0 : 0.7}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* Wings - translucent and beautiful */}
      <mesh
        ref={leftWingRef}
        position={[-0.45, 0.25, -0.1]}
        rotation={[0, 0.3, 0]}
        castShadow
      >
        <boxGeometry args={[0.05, 0.6, 0.4]} />
        <meshPhysicalMaterial
          color={currentColors.wing}
          transparent
          opacity={0.5}
          metalness={0.9}
          roughness={0.05}
          emissive={currentColors.wingGlow}
          emissiveIntensity={0.4}
          transmission={0.8}
          thickness={0.5}
        />
      </mesh>
      <mesh
        ref={rightWingRef}
        position={[0.45, 0.25, -0.1]}
        rotation={[0, -0.3, 0]}
        castShadow
      >
        <boxGeometry args={[0.05, 0.6, 0.4]} />
        <meshPhysicalMaterial
          color={currentColors.wing}
          transparent
          opacity={0.5}
          metalness={0.9}
          roughness={0.05}
          emissive={currentColors.wingGlow}
          emissiveIntensity={0.4}
          transmission={0.8}
          thickness={0.5}
        />
      </mesh>

      {/* Gender-specific accessory */}
      {gender === 'male' ? (
        // Bowtie for male
        <group position={[0, 0.35, 0.3]}>
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.08, 0.04]} />
            <meshStandardMaterial 
              color={currentColors.accent}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.08, 0.04]} />
            <meshStandardMaterial 
              color={currentColors.accent}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[0.05, 0.08, 0.05]} />
            <meshStandardMaterial 
              color={currentColors.accentDark}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        </group>
      ) : (
        // Bow for female
        <group position={[-0.2, 0.85, 0]}>
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
            <sphereGeometry args={[0.1, 32, 32]} />
            <meshStandardMaterial 
              color={currentColors.accent}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <sphereGeometry args={[0.1, 32, 32]} />
            <meshStandardMaterial 
              color={currentColors.accent}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05, 32, 32]} />
            <meshStandardMaterial 
              color={currentColors.accentDark}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
        </group>
      )}

      {/* Speech Bubble */}
      {speechText && (
        <group position={[0, 1.5, 0]}>
          {/* Bubble background */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[2, 0.5, 0.1]} />
            <meshStandardMaterial
              color="#FFFFFF"
              transparent
              opacity={0.95}
            />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={0.18}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.8}
            font="/fonts/Inter-Bold.woff"
          >
            {speechText}
          </Text>
        </group>
      )}

      {/* Click Feedback Tooltip */}
      {showClickFeedback && (
        <group position={[0, 2.2, 0]}>
          {/* Animated heart indicator */}
          <mesh 
            position={[0, Math.sin(Date.now() * 0.005) * 0.1, 0]}
            scale={[1 + Math.sin(Date.now() * 0.008) * 0.1, 1 + Math.sin(Date.now() * 0.008) * 0.1, 1]}
          >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color={currentColors.accent}
              emissive={currentColors.accent}
              emissiveIntensity={0.5}
              transparent
              opacity={0.9}
            />
          </mesh>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.14}
            color={currentColors.accent}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#FFFFFF"
            font="/fonts/Inter-Bold.woff"
          >
            Great job! 🎉
          </Text>
        </group>
      )}

      {/* Sparkle particles around Jubee - mood-responsive */}
      <Sparkles
        count={currentMood === 'excited' ? 40 : currentMood === 'tired' ? 8 : 20}
        scale={currentMood === 'excited' ? 2.5 : currentMood === 'tired' ? 1.5 : 2}
        size={currentMood === 'excited' ? 4 : currentMood === 'tired' ? 2 : 3}
        speed={currentMood === 'excited' ? 0.6 : currentMood === 'tired' ? 0.1 : 0.3}
        opacity={currentMood === 'excited' ? 0.8 : currentMood === 'tired' ? 0.3 : 0.6}
        color={currentColors.accent}
      />

      {/* Ambient glow around Jubee - mood-responsive intensity */}
      <pointLight
        position={[0, 0, 0]}
        color={currentColors.accent}
        intensity={currentMood === 'excited' ? 2.5 : currentMood === 'frustrated' ? 0.8 : 1.5}
        distance={4}
        decay={2}
      />
      
      {/* Spotlight from above for dramatic effect */}
      <spotLight
        position={[0, 3, 2]}
        angle={0.4}
        penumbra={1}
        intensity={currentMood === 'excited' ? 1.8 : currentMood === 'tired' ? 0.6 : 1.2}
        color={currentColors.bodyGlow}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </a.group>
  )
}
