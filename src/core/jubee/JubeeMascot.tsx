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
import { Group, Mesh } from 'three'
import { useJubeeStore } from '../../store/useJubeeStore'
import * as THREE from 'three'

interface JubeeProps {
  position?: [number, number, number]
  animation?: string
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

export function JubeeMascot({ position = [2.5, -1.5, 0], animation = 'idle' }: JubeeProps) {
  const group = useRef<Group>(null)
  const bodyRef = useRef<Mesh>(null)
  const headRef = useRef<Mesh>(null)
  const leftWingRef = useRef<Mesh>(null)
  const rightWingRef = useRef<Mesh>(null)
  const leftEyeRef = useRef<Mesh>(null)
  const rightEyeRef = useRef<Mesh>(null)
  const { camera } = useThree()
  const [isHovered, setIsHovered] = useState(false)
  const [blinkTime, setBlinkTime] = useState(0)
  const { gender, speechText, updatePosition, speak, triggerAnimation, cleanup } = useJubeeStore()

  // Memoize current colors from design system
  const currentColors = useMemo(() => getJubeeColors(gender), [gender])
  
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
  }

  useFrame((state) => {
    if (!group.current) return

    const time = state.clock.elapsedTime
    
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

    // Update position in store
    updatePosition(group.current.position)

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

    // Wing flapping - faster during page transition
    const wingSpeed = animation === 'pageTransition' ? 25 : animation === 'excited' ? 15 : animation === 'celebrate' ? 20 : 8
    if (leftWingRef.current) {
      leftWingRef.current.rotation.y = Math.sin(time * wingSpeed) * 0.5 + 0.3
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.y = -Math.sin(time * wingSpeed) * 0.5 - 0.3
    }

    // Celebration spin
    if (animation === 'celebrate') {
      group.current.rotation.y = time * 2
    } else if (animation !== 'pageTransition') {
      group.current.rotation.y = 0
    }

    // Hover effect - reuse vector objects
    if (group.current) {
      targetScale.set(isHovered ? 1.1 : 1, isHovered ? 1.1 : 1, isHovered ? 1.1 : 1)
      group.current.scale.lerp(targetScale, 0.1)
    }
  })

  return (
    <group
      ref={group}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
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
        <sphereGeometry args={[0.5, 64, 64]} />
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
        <sphereGeometry args={[0.51, 64, 64, 0, Math.PI * 2, 0.7, 0.3]} />
        <meshStandardMaterial 
          color={currentColors.stripe}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.15, 0]} castShadow>
        <sphereGeometry args={[0.51, 64, 64, 0, Math.PI * 2, 1.3, 0.3]} />
        <meshStandardMaterial 
          color={currentColors.stripe}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Accent stripe (gender-specific color) */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <sphereGeometry args={[0.52, 64, 64, 0, Math.PI * 2, 1.6, 0.2]} />
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
        <sphereGeometry args={[0.35, 64, 64]} />
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
        <mesh ref={leftEyeRef} position={[-0.15, 0.08, 0.28]} castShadow>
          <sphereGeometry args={[0.13, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyeWhite}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>
        {/* Left pupil */}
        <mesh position={[-0.15, 0.08, 0.38]} castShadow>
          <sphereGeometry args={[0.07, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyePupil}
            roughness={0.8}
          />
        </mesh>
        {/* Left eye shine - multiple for sparkle effect */}
        <mesh position={[-0.13, 0.13, 0.43]} castShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} />
        </mesh>
        <mesh position={[-0.16, 0.1, 0.42]} castShadow>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} transparent opacity={0.7} />
        </mesh>

        {/* Right eye white */}
        <mesh ref={rightEyeRef} position={[0.15, 0.08, 0.28]} castShadow>
          <sphereGeometry args={[0.13, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyeWhite}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>
        {/* Right pupil */}
        <mesh position={[0.15, 0.08, 0.38]} castShadow>
          <sphereGeometry args={[0.07, 32, 32]} />
          <meshStandardMaterial 
            color={currentColors.eyePupil}
            roughness={0.8}
          />
        </mesh>
        {/* Right eye shine - multiple for sparkle effect */}
        <mesh position={[0.17, 0.13, 0.43]} castShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} />
        </mesh>
        <mesh position={[0.14, 0.1, 0.42]} castShadow>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color={currentColors.eyeWhite} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Smile - cute torus */}
      <mesh position={[0, 0.55, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.12, 0.02, 16, 48, Math.PI]} />
        <meshStandardMaterial 
          color={currentColors.eyePupil}
          roughness={0.5}
        />
      </mesh>

      {/* Rosy cheeks */}
      <mesh position={[-0.28, 0.58, 0.15]} castShadow>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial 
          color={currentColors.cheek} 
          transparent 
          opacity={0.7}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0.28, 0.58, 0.15]} castShadow>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial 
          color={currentColors.cheek} 
          transparent 
          opacity={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Antennae */}
      <group>
        {/* Left antenna */}
        <mesh position={[-0.15, 0.95, 0]} castShadow>
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
            emissiveIntensity={0.7}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        {/* Right antenna */}
        <mesh position={[0.15, 0.95, 0]} castShadow>
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
            emissiveIntensity={0.7}
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

      {/* Sparkle particles around Jubee */}
      <Sparkles
        count={20}
        scale={2}
        size={3}
        speed={0.3}
        opacity={0.6}
        color={currentColors.accent}
      />

      {/* Ambient glow around Jubee - enhanced */}
      <pointLight
        position={[0, 0, 0]}
        color={currentColors.accent}
        intensity={1.5}
        distance={4}
        decay={2}
      />
      
      {/* Spotlight from above for dramatic effect */}
      <spotLight
        position={[0, 3, 2]}
        angle={0.4}
        penumbra={1}
        intensity={1.2}
        color={currentColors.bodyGlow}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </group>
  )
}
