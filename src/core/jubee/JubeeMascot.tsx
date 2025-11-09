import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { useJubeeStore } from '../../store/useJubeeStore'
import * as THREE from 'three'

interface JubeeProps {
  position?: [number, number, number]
  animation?: string
}

export function JubeeMascot({ position = [3, -2, 0], animation = 'idle' }: JubeeProps) {
  const group = useRef<Group>(null)
  const bodyRef = useRef<Mesh>(null)
  const headRef = useRef<Mesh>(null)
  const leftWingRef = useRef<Mesh>(null)
  const rightWingRef = useRef<Mesh>(null)
  const { camera } = useThree()
  const [isHovered, setIsHovered] = useState(false)
  const { gender, speechText, updatePosition, speak, triggerAnimation } = useJubeeStore()

  const greetings = [
    "Buzz buzz! Hello!",
    "Let's learn together!",
    "You're doing great!",
    "I'm so happy to see you!",
    "Ready for an adventure?"
  ]

  const colors = {
    male: {
      body: '#FFD700', // Gold
      accent: '#4A90E2', // Blue
      stripes: '#2E5C8A' // Dark blue
    },
    female: {
      body: '#FFD700', // Gold
      accent: '#FF69B4', // Pink
      stripes: '#FF1493' // Deep pink
    }
  }

  const currentColors = colors[gender]

  const handleClick = (e: any) => {
    e.stopPropagation()
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    speak(randomGreeting)
    triggerAnimation('celebrate')
  }

  useFrame((state) => {
    if (!group.current) return

    const time = state.clock.elapsedTime

    // Look at camera
    group.current.lookAt(camera.position)

    // Hovering motion
    const baseY = position[1]
    const hoverSpeed = animation === 'excited' ? 3 : 2
    const hoverAmount = animation === 'excited' ? 0.2 : 0.1
    group.current.position.y = baseY + Math.sin(time * hoverSpeed) * hoverAmount

    // Update position
    updatePosition(group.current.position)

    // Body wobble
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(time * 1.5) * 0.05
    }

    // Head tilt
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 2) * 0.1
      headRef.current.rotation.z = Math.sin(time * 1.5) * 0.08
    }

    // Wing flapping
    const wingSpeed = animation === 'excited' ? 15 : animation === 'celebrate' ? 20 : 8
    if (leftWingRef.current) {
      leftWingRef.current.rotation.y = Math.sin(time * wingSpeed) * 0.5 + 0.3
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.y = -Math.sin(time * wingSpeed) * 0.5 - 0.3
    }

    // Celebration spin
    if (animation === 'celebrate') {
      group.current.rotation.y = time * 2
    } else {
      group.current.rotation.y = 0
    }

    // Hover effect
    if (isHovered && group.current) {
      group.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1)
    } else if (group.current) {
      group.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
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

      {/* Eyes - large and expressive */}
      <group position={[0, 0.65, 0]}>
        {/* Left eye white */}
        <mesh position={[-0.15, 0.08, 0.28]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Left pupil */}
        <mesh position={[-0.15, 0.08, 0.38]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Left eye shine */}
        <mesh position={[-0.13, 0.12, 0.42]} castShadow>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Right eye white */}
        <mesh position={[0.15, 0.08, 0.28]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Right pupil */}
        <mesh position={[0.15, 0.08, 0.38]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Right eye shine */}
        <mesh position={[0.17, 0.12, 0.42]} castShadow>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
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

      {/* Ambient glow around Jubee */}
      <pointLight
        position={[0, 0, 0]}
        color={currentColors.accent}
        intensity={0.5}
        distance={2}
      />
    </group>
  )
}
