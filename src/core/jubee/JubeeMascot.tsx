import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Sphere, Box } from '@react-three/drei'
import { Group } from 'three'
import { useJubeeStore } from '../../store/useJubeeStore'

interface JubeeProps {
  position?: [number, number, number]
  animation?: string
}

export function JubeeMascot({ position = [3, -2, 0], animation = 'idle' }: JubeeProps) {
  const group = useRef<Group>(null)
  const { camera } = useThree()
  const { gender, speechText, updatePosition } = useJubeeStore()

  const colors = {
    male: { primary: '#FFD93D', accent: '#4169E1' },
    female: { primary: '#FFD93D', accent: '#FF69B4' }
  }

  useEffect(() => {
    console.log('Animation:', animation)
  }, [animation])

  useFrame((state) => {
    if (!group.current) return
    group.current.lookAt(camera.position)
    const baseY = position[1]
    group.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2) * 0.1
    updatePosition(group.current.position)
  })

  return (
    <group ref={group} position={position}>
      {/* Body */}
      <Sphere args={[0.4, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color={colors[gender].primary} />
      </Sphere>

      {/* Head */}
      <Sphere args={[0.3, 32, 32]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color={colors[gender].primary} />
      </Sphere>

      {/* Eyes */}
      <Sphere args={[0.08, 16, 16]} position={[-0.1, 0.55, 0.25]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.1, 0.55, 0.25]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>

      {/* Stripes */}
      <Box args={[0.6, 0.15, 0.5]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#000000" />
      </Box>
      <Box args={[0.6, 0.15, 0.5]} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#000000" />
      </Box>

      {/* Wings */}
      <Box args={[0.3, 0.5, 0.05]} position={[-0.4, 0.2, -0.1]} rotation={[0, 0, 0.3]}>
        <meshStandardMaterial color="#ffffff" opacity={0.7} transparent />
      </Box>
      <Box args={[0.3, 0.5, 0.05]} position={[0.4, 0.2, -0.1]} rotation={[0, 0, -0.3]}>
        <meshStandardMaterial color="#ffffff" opacity={0.7} transparent />
      </Box>

      {/* Accent bow */}
      <Box args={[0.2, 0.1, 0.1]} position={[0, 0.4, 0.25]}>
        <meshStandardMaterial color={colors[gender].accent} />
      </Box>

      {/* Speech Bubble */}
      {speechText && (
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="black" anchorX="center" anchorY="middle" maxWidth={1.5}>
          {speechText}
        </Text>
      )}
    </group>
  )
}
