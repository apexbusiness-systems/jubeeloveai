import { memo, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { JubeeMascot } from '@/core/jubee/JubeeMascot';
import { JubeeErrorBoundary } from './JubeeErrorBoundary';
import { useJubeePerformance } from '@/hooks/useJubeePerformance';
import { logger } from '@/lib/logger';

interface JubeeCanvasProps {
  jubeePosition: { x: number; y: number; z: number };
  jubeeAnimation: string;
}

export const JubeeCanvas = memo(function JubeeCanvas({ 
  jubeePosition, 
  jubeeAnimation 
}: JubeeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { profile } = useJubeePerformance();
  
  console.log('[🔍 DIAGNOSTIC] JubeeCanvas render:', {
    jubeePosition,
    jubeeAnimation,
    canvasRef: canvasRef.current,
    profile: profile.quality
  });
  
  // Optimized canvas creation with performance-aware settings
  const handleCreated = useCallback(({ gl }: any) => {
    console.group('[🔍 DIAGNOSTIC] Canvas Creation')
    console.log('Quality profile:', profile.quality)
    console.log('Canvas ref:', canvasRef.current)
    console.log('GL context:', {
      renderer: gl.info.renderer,
      vendor: gl.info.vendor,
      version: gl.getParameter(gl.VERSION)
    })
    console.groupEnd()
    
    logger.dev('[Jubee Canvas] Initialized with quality:', profile.quality);
    
    // Configure WebGL for optimal performance
    gl.setClearColor('#000000', 0);
    gl.setSize(400, 450, false); // Don't update style for perf
    
    // Performance optimizations
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    
    // Enable optimizations
    if (profile.quality === 'low') {
      gl.shadowMap.enabled = false;
    } else {
      gl.shadowMap.enabled = true;
      gl.shadowMap.autoUpdate = false; // Manual shadow updates only when needed
    }
  }, [profile.quality]);

  return (
    <JubeeErrorBoundary>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 6], fov: 45 }}
        shadows={profile.shadowsEnabled}
        dpr={[1, 2]} // Adaptive pixel ratio
        performance={{ min: 0.5 }} // Allow frame rate to drop to maintain 30fps minimum
        frameloop="always"
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        gl={{
          antialias: profile.quality !== 'low',
          alpha: true,
          powerPreference: "high-performance",
          stencil: false, // Disable stencil buffer for performance
          depth: true,
          preserveDrawingBuffer: false // Don't preserve for performance
        }}
        onCreated={handleCreated}
      >
        {/* Adaptive lighting based on performance profile */}
        <ambientLight intensity={1.2} />
        
        {profile.quality !== 'low' && (
          <>
            <directionalLight
              position={[5, 5, 5]}
              intensity={1.5}
              castShadow={profile.shadowsEnabled}
              shadow-mapSize-width={profile.shadowsEnabled ? 1024 : 512}
              shadow-mapSize-height={profile.shadowsEnabled ? 1024 : 512}
              shadow-camera-far={20}
              shadow-camera-near={0.5}
            />
            <directionalLight
              position={[-5, 3, -5]}
              intensity={0.8}
              color="#ffd700"
            />
          </>
        )}
        
        <hemisphereLight
          color="#87CEEB"
          groundColor="#FFD700"
          intensity={0.6}
        />
        
        <Suspense fallback={null}>
          <JubeeMascot
            position={[jubeePosition.x, jubeePosition.y, jubeePosition.z]}
            animation={jubeeAnimation}
            performanceProfile={profile}
          />
        </Suspense>
      </Canvas>
    </JubeeErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization - only re-render when necessary
  return (
    prevProps.jubeePosition.x === nextProps.jubeePosition.x &&
    prevProps.jubeePosition.y === nextProps.jubeePosition.y &&
    prevProps.jubeePosition.z === nextProps.jubeePosition.z &&
    prevProps.jubeeAnimation === nextProps.jubeeAnimation
  );
});
