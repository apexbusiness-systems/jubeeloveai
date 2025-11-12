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
import { useFrame, useThree } from '@react-three/fiber'
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

const COLORS = {
  male: {
    body: '#FFD700',
    accent: '#4A90E2',
    stripes: '#2E5C8A'
  },
  female: {
    body: '#FFD700',
    accent: '#FF69B4',
    stripes: '#FF1493'
  }
} as const

// Reusable vectors for performance
const tempVector = new THREE.Vector3()
const targetScale = new THREE.Vector3()

export function JubeeMascot({ position = [3, -2, 0], animation = 'idle' }: JubeeProps) {
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

  // Memoize current colors
  const currentColors = useMemo(() => COLORS[gender], [gender])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const handleClick = (e: any) => {
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
      const flyX = Math.sin(transitionProgress * Math.PI * 2) * 5 // Fly across screen
      const flyY = position[1] + Math.sin(transitionProgress * Math.PI) * 2 // Arc motion
      group.current.position.x = flyX
      group.current.position.y = flyY
      group.current.position.z = position[2]
      
      // Spin while flying
      group.current.rotation.y = transitionProgress * Math.PI * 4
    } else {
      // Normal hovering motion
      const baseY = position[1]
      const hoverSpeed = animation === 'excited' ? 3 : 2
      const hoverAmount = animation === 'excited' ? 0.2 : 0.1
      group.current.position.y = baseY + Math.sin(time * hoverSpeed) * hoverAmount
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
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={currentColors.body}
          roughness={0.4}
          metalness={0.2}
          emissive={currentColors.body}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Black stripes on body */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.51, 32, 32, 0, Math.PI * 2, 0.7, 0.3]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0, -0.15, 0]} castShadow>
        <sphereGeometry args={[0.51, 32, 32, 0, Math.PI * 2, 1.3, 0.3]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Accent stripe (gender-specific color) */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <sphereGeometry args={[0.52, 32, 32, 0, Math.PI * 2, 1.6, 0.2]} />
        <meshStandardMaterial color={currentColors.stripes} />
      </mesh>

      {/* Head - medium sphere */}
      <mesh ref={headRef} position={[0, 0.65, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={currentColors.body}
          roughness={0.4}
          metalness={0.2}
          emissive={currentColors.body}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Eyes - large and expressive with blinking */}
      <group position={[0, 0.65, 0]}>
        {/* Left eye white */}
        <mesh ref={leftEyeRef} position={[-0.15, 0.08, 0.28]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Left pupil */}
        <mesh position={[-0.15, 0.08, 0.38]} castShadow>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Left eye shine - multiple for sparkle effect */}
        <mesh position={[-0.13, 0.13, 0.43]} castShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[-0.16, 0.1, 0.42]} castShadow>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} />
        </mesh>

        {/* Right eye white */}
        <mesh ref={rightEyeRef} position={[0.15, 0.08, 0.28]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Right pupil */}
        <mesh position={[0.15, 0.08, 0.38]} castShadow>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Right eye shine - multiple for sparkle effect */}
        <mesh position={[0.17, 0.13, 0.43]} castShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.14, 0.1, 0.42]} castShadow>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Smile - cute torus */}
      <mesh position={[0, 0.55, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.12, 0.02, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Rosy cheeks */}
      <mesh position={[-0.28, 0.58, 0.15]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFB6C1" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.28, 0.58, 0.15]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFB6C1" transparent opacity={0.6} />
      </mesh>

      {/* Antennae */}
      <group>
        {/* Left antenna */}
        <mesh position={[-0.15, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.15, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color={currentColors.accent}
            emissive={currentColors.accent}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Right antenna */}
        <mesh position={[0.15, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.15, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color={currentColors.accent}
            emissive={currentColors.accent}
            emissiveIntensity={0.5}
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
        <meshStandardMaterial
          color="#E0F7FA"
          transparent
          opacity={0.4}
          metalness={0.8}
          roughness={0.1}
          emissive="#B3E5FC"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh
        ref={rightWingRef}
        position={[0.45, 0.25, -0.1]}
        rotation={[0, -0.3, 0]}
        castShadow
      >
        <boxGeometry args={[0.05, 0.6, 0.4]} />
        <meshStandardMaterial
          color="#E0F7FA"
          transparent
          opacity={0.4}
          metalness={0.8}
          roughness={0.1}
          emissive="#B3E5FC"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Gender-specific accessory */}
      {gender === 'male' ? (
        // Bowtie for male
        <group position={[0, 0.35, 0.3]}>
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.08, 0.04]} />
            <meshStandardMaterial color={currentColors.accent} />
          </mesh>
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.08, 0.04]} />
            <meshStandardMaterial color={currentColors.accent} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.05, 0.08, 0.05]} />
            <meshStandardMaterial color={currentColors.stripes} />
          </mesh>
        </group>
      ) : (
        // Bow for female
        <group position={[-0.2, 0.85, 0]}>
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color={currentColors.accent} />
          </mesh>
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color={currentColors.accent} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={currentColors.stripes} />
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
        intensity={0.8}
        distance={3}
        decay={2}
      />
      
      {/* Spotlight from above for dramatic effect */}
      <spotLight
        position={[0, 3, 2]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color={currentColors.body}
        castShadow
      />
    </group>
  )
}
