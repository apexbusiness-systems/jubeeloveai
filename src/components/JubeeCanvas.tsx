import { memo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { JubeeMascot } from '@/core/jubee/JubeeMascot';
import { JubeeErrorBoundary } from './JubeeErrorBoundary';
import { logger } from '@/lib/logger';

interface JubeeCanvasProps {
  jubeePosition: { x: number; y: number; z: number };
  jubeeAnimation: string;
}

export const JubeeCanvas = memo(function JubeeCanvas({ 
  jubeePosition, 
  jubeeAnimation 
}: JubeeCanvasProps) {
  return (
    <JubeeErrorBoundary>
      <Canvas
        key="jubee-canvas-main"
        camera={{ position: [0, 0, 6], fov: 45 }}
        shadows
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          logger.dev('[Jubee] Canvas created with dimensions: 400x450');
          gl.setClearColor('#000000', 0);
          gl.setSize(400, 450);
        }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-5, 3, -5]}
          intensity={0.8}
          color="#ffd700"
        />
        <hemisphereLight
          color="#87CEEB"
          groundColor="#FFD700"
          intensity={0.6}
        />
        <Suspense fallback={null}>
          <JubeeMascot
            position={[jubeePosition.x, jubeePosition.y, jubeePosition.z]}
            animation={jubeeAnimation}
          />
        </Suspense>
      </Canvas>
    </JubeeErrorBoundary>
  );
});
