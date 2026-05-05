/**
 * Jubee 3D Direct Canvas
 * 
 * Uses Three.js directly without React Three Fiber portal.
 * Eliminates state sync issues while maintaining premium 3D visuals.
 * 
 * Benefits over R3F Portal:
 * - No portal rendering complexity
 * - Direct DOM positioning (simpler state management)
 * - Same visual quality
 * - Better mobile performance
 * - More reliable state synchronization
 */

import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { useJubeeStore } from '@/store/useJubeeStore';
import { useJubeeGreeting } from '@/hooks/useJubeeGreeting';
import { logger } from '@/lib/logger';
import { 
  validatePosition as validateContainerPosition,
  getContainerDimensions 
} from '@/core/jubee/JubeePositionManager';
import { useJubeeRenderingGuard } from '@/hooks/useJubeeRenderingGuard';
import { validateJubeeState } from '@/core/jubee/JubeeStateValidator';
import { useWebGLContextRecovery } from '@/hooks/useWebGLContextRecovery';
import { jubeeErrorRecovery } from '@/core/jubee/JubeeErrorRecovery';
import { useJubeeLifecycleDiagnostics } from '@/hooks/useJubeeLifecycleDiagnostics';

interface JubeeCanvas3DDirectProps {
  className?: string;
}

// Cached parts interface
interface JubeeParts {
  body: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  leftPupil: THREE.Mesh;
  rightPupil: THREE.Mesh;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  leftAntenna: THREE.Mesh;
  rightAntenna: THREE.Mesh;
  leftBulb: THREE.Mesh;
  rightBulb: THREE.Mesh;
  // Gender-specific accessories (optional)
  bow?: THREE.Group;          // Girl: pink bow on head
  bowtie?: THREE.Mesh;        // Boy: black bowtie under chin
  leftLash?: THREE.Mesh;      // Girl: eyelash
  rightLash?: THREE.Mesh;     // Girl: eyelash
}

function JubeeCanvas3DDirectComponent({ className }: JubeeCanvas3DDirectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const jubeeGroupRef = useRef<THREE.Group | null>(null);
  const jubeePartsRef = useRef<JubeeParts | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Get current location for contextual greetings
  const location = useLocation();
  
  const containerPosition = useJubeeStore(state => state.containerPosition);
const isVisible = useJubeeStore(state => state.isVisible);
const currentAnimation = useJubeeStore(state => state.currentAnimation);
const gender = useJubeeStore(state => state.gender);
const currentMood = useJubeeStore(state => state.currentMood);
const setContainerPosition = useJubeeStore(state => state.setContainerPosition);
const speak = useJubeeStore(state => state.speak);
const triggerAnimation = useJubeeStore(state => state.triggerAnimation);
const setMood = useJubeeStore(state => state.setMood);
  
  // Contextual greeting system - uses current route for activity detection
  const { getGreeting } = useJubeeGreeting({ pathname: location.pathname });
  
  // Track interaction for greeting variations
  const interactionCountRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startBottom: number; startRight: number } | null>(null);
  
  // Click feedback state - triggers pulse/glow animation
  const [isClickActive, setIsClickActive] = useState(false);
  const clickFeedbackTimeRef = useRef<number>(0);
  
  // Get responsive container dimensions
  const [containerDimensions, setContainerDimensions] = useState(() => getContainerDimensions());

  // Rendering guard setup
  const getWebGLContext = useCallback(() => {
    return rendererRef.current?.getContext() || null;
  }, []);

  const handleRecoveryNeeded = useCallback(() => {
    logger.warn('[Jubee3DDirect] Recovery triggered - resetting position');
    
    // Validate and reset to safe position
    const validation = validateJubeeState({
      containerPosition: { bottom: 200, right: 100 },
      position: { x: 0, y: 0, z: 0 },
      isVisible: true,
      currentAnimation: 'idle',
    });

    if (validation.valid || validation.sanitizedState) {
      setContainerPosition(validation.sanitizedState.containerPosition || { bottom: 200, right: 100 });
    }
  }, [setContainerPosition]);

  const renderingGuard = useJubeeRenderingGuard(
    containerRef,
    canvasRef,
    getWebGLContext,
    handleRecoveryNeeded
  );

  // WebGL context recovery (initialized but used internally for side effects)
  useWebGLContextRecovery(canvasRef, {
    onContextLost: () => {
      logger.error('[Jubee3DDirect] WebGL context lost');
      jubeeErrorRecovery.attemptRecovery(new Error('WebGL context lost'));
    },
    onContextRestored: () => {
      logger.info('[Jubee3DDirect] WebGL context restored');
      jubeeErrorRecovery.reset();
    },
  });

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setContainerDimensions(getContainerDimensions());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lifecycle diagnostics for monitoring (used internally for side effects)
  useJubeeLifecycleDiagnostics(containerRef);

  // DIAGNOSTIC: Component lifecycle tracking
  useEffect(() => {
    logger.dev('[DIAGNOSTIC] JubeeCanvas3DDirect COMPONENT MOUNTED', {
      isVisible,
      containerPosition,
      currentAnimation,
      timestamp: Date.now()
    });

    return () => {
      logger.dev('[DIAGNOSTIC] JubeeCanvas3DDirect COMPONENT UNMOUNTING', {
        timestamp: Date.now()
      });
    };
  }, []); // Empty deps - mount/unmount only

  // Ref validation - only log in dev mode once on mount, not repeatedly
  useEffect(() => {
    if (import.meta.env.DEV) {
      logger.dev('[DIAGNOSTIC] Initial Ref Check', {
        containerRef: containerRef.current ? 'ASSIGNED' : 'NULL',
        canvasRef: canvasRef.current ? 'ASSIGNED' : 'NULL',
        containerInDOM: containerRef.current ? document.contains(containerRef.current) : false,
        canvasInDOM: canvasRef.current ? document.contains(canvasRef.current) : false,
        timestamp: Date.now()
      });
    }
  }, []);

  // DIAGNOSTIC: Visibility state tracking
  useEffect(() => {
    logger.dev('[DIAGNOSTIC] Visibility State Changed', {
      isVisible,
      containerExists: !!containerRef.current,
      canvasExists: !!canvasRef.current,
      timestamp: Date.now()
    });
  }, [isVisible]);

  // Initialize Three.js scene
  useEffect(() => {
    logger.dev('[DIAGNOSTIC] Three.js Init Effect Running', {
      hasContainerRef: !!containerRef.current,
      hasCanvasRef: !!canvasRef.current,
      timestamp: Date.now()
    });

    if (!canvasRef.current || !containerRef.current) {
      logger.dev('[DIAGNOSTIC] Three.js Init BLOCKED - Refs not ready', {
        containerRef: containerRef.current ? 'OK' : 'MISSING',
        canvasRef: canvasRef.current ? 'OK' : 'MISSING'
      });
      return;
    }

    logger.dev('[Jubee3DDirect] Initializing Three.js scene');

    // Create scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Create camera - positioned closer for better visibility
    const camera = new THREE.PerspectiveCamera(
      45,  // Slightly narrower FOV for better framing
      1, // Will be updated on resize
      0.1,
      1000
    );
    camera.position.set(0, 0.5, 5);  // Closer to model, slightly elevated
    camera.lookAt(0, 0.5, 0);  // Look at center of model
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent
    rendererRef.current = renderer;

    // Create Jubee 3D model
    const jubeeGroup = new THREE.Group();
    
    // Scale model for visibility in the container
    // Reduced by 20% from 0.7 to 0.56 for better fit
    jubeeGroup.scale.set(0.56, 0.56, 0.56);
    
    sceneRef.current.add(jubeeGroup);
    jubeeGroupRef.current = jubeeGroup;

    // Build Jubee geometry
    const parts = buildJubeeModel(jubeeGroup, gender);
    jubeePartsRef.current = parts;

    // Add lights - Enhanced for vibrant visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Main directional light - strong frontal lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(3, 5, 8);
    scene.add(directionalLight);

    // Fill light from the left - warm tone
    const fillLight = new THREE.DirectionalLight(0xfff5e0, 0.8);
    fillLight.position.set(-5, 3, 3);
    scene.add(fillLight);

    // Rim light from behind - creates edge definition
    const rimLight = new THREE.DirectionalLight(0xffe080, 0.6);
    rimLight.position.set(0, 2, -5);
    scene.add(rimLight);

    // Point light for glow effect - positioned in front
    const glowLight = new THREE.PointLight(0xffcc00, 1.0, 15);
    glowLight.position.set(0, 0, 4);
    scene.add(glowLight);

    // Hemisphere light for natural fill
    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    scene.add(hemiLight);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation loop
    let lastTime = performance.now();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Validate rendering state before each frame
      if (renderingGuard) {
        renderingGuard.validateContainer(containerRef.current);
        renderingGuard.validateCanvas(canvasRef.current);
        if (renderer) {
          renderingGuard.validateWebGL(renderer.getContext());
        }
      }

      // Update animations based on mood and state
      if (jubeePartsRef.current) {
        updateJubeeAnimation(jubeeGroup, jubeePartsRef.current, currentAnimation, currentMood, delta);
      }

      // Render scene
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        
        // Record successful render
        if (renderingGuard) {
          renderingGuard.recordRender();
        }
      }
    };

    animate();

    // Cleanup
    return () => {
      logger.dev('[Jubee3DDirect] Cleaning up Three.js scene');
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (jubeeGroup) {
        jubeeGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [gender]); // Rebuild when gender changes

  // Update animation state
  useEffect(() => {
    if (jubeeGroupRef.current) {
      logger.dev('[Jubee3DDirect] Animation changed:', currentAnimation);
    }
  }, [currentAnimation, currentMood]);

  // Dragging handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startBottom: containerPosition.bottom,
      startRight: containerPosition.right,
    };
    logger.dev('[Jubee3DDirect] Drag started', dragStartRef.current);
  }, [containerPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const proposedPosition = {
      bottom: dragStartRef.current.startBottom - deltaY,
      right: dragStartRef.current.startRight - deltaX,
    };

    // Double validation: position manager + state validator
    const validation = validateJubeeState({
      containerPosition: proposedPosition,
    });

    if (validation.valid || validation.sanitizedState.containerPosition) {
      const safePosition = validation.sanitizedState.containerPosition || proposedPosition;
      setContainerPosition(safePosition);
    } else {
      logger.warn('[Jubee3DDirect] Invalid drag position rejected', validation.errors);
    }
  }, [isDragging, setContainerPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      logger.dev('[Jubee3DDirect] Drag ended');
    }
  }, [isDragging]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startBottom: containerPosition.bottom,
      startRight: containerPosition.right,
    };
  }, [containerPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;

    const newPosition = validateContainerPosition({
      bottom: dragStartRef.current.startBottom - deltaY,
      right: dragStartRef.current.startRight - deltaX,
    });

    setContainerPosition(newPosition);
  }, [isDragging, setContainerPosition]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  }, [isDragging]);

  // Click handler for Jubee interaction - triggers greeting and animation
  const handleJubeeClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Don't trigger click if we just finished dragging
    if (isDragging) return;
    
    // Prevent if this was a drag gesture (moved more than 5px)
    if (dragStartRef.current) return;
    
    e.stopPropagation();
    
    // Trigger click feedback animation
    setIsClickActive(true);
    clickFeedbackTimeRef.current = performance.now();
    
    // Reset click feedback after animation completes
    setTimeout(() => {
      setIsClickActive(false);
    }, 600);
    
    // Increment interaction count
    interactionCountRef.current += 1;
    const count = interactionCountRef.current;
    
    // Trigger excited animation
    triggerAnimation('excited');
    setMood('excited');
    
    // Use contextual greeting system for time/activity-aware greetings
    const { greeting, timeOfDay, activity } = getGreeting();
    speak(greeting, 'excited');
    
    logger.dev('[Jubee3DDirect] Click interaction', { count, greeting, timeOfDay, activity });
    
    // Reset mood after a delay
    setTimeout(() => {
      setMood('happy');
      triggerAnimation('idle');
    }, 3000);
  }, [isDragging, speak, triggerAnimation, setMood, getGreeting]);

  // Attach global mouse/touch listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Only log render completion in dev mode, and avoid excessive logging
  const hasLoggedRender = useRef(false);
  useEffect(() => {
    if (import.meta.env.DEV && !hasLoggedRender.current) {
      logger.dev('[DIAGNOSTIC] JubeeCanvas3DDirect mounted and rendered', {
        containerAttached: containerRef.current && document.contains(containerRef.current),
        canvasAttached: canvasRef.current && document.contains(canvasRef.current),
        timestamp: Date.now()
      });
      hasLoggedRender.current = true;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`jubee-container ${className || ''} ${isClickActive ? 'jubee-click-active' : ''}`}
      style={{
        position: 'fixed',
        bottom: `${containerPosition.bottom}px`,
        right: `${containerPosition.right}px`,
        width: `${containerDimensions.width}px`,
        height: `${containerDimensions.height}px`,
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transition: isDragging ? 'none' : 'all 0.3s ease',
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        // Click feedback glow effect
        filter: isClickActive 
          ? 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 50px rgba(255, 200, 0, 0.7)) drop-shadow(0 0 75px rgba(255, 180, 0, 0.5))'
          : undefined,
        transform: isClickActive ? 'scale(1.15)' : undefined,
      }}
      data-jubee-container="true"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <canvas
        ref={canvasRef}
        className="jubee-canvas"
        data-jubee-canvas="true"
        data-jubee-scale="0.414"
        onClick={handleJubeeClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

/**
 * Build the Jubee 3D model with TRUE gender differentiation.
 * Girl Jubee: warm pink-yellow body, eyelashes, big rosy cheeks, hot-pink head bow.
 * Boy Jubee: deep golden body, sharper longer antennae, black bowtie, cyan accent bulbs.
 */
function buildJubeeModel(group: THREE.Group, gender: 'male' | 'female'): JubeeParts {
  const isGirl = gender === 'female';

  const colors = {
    body: isGirl ? 0xFFCC4D : 0xFFB400,         // girl: warm bright honey | boy: deeper amber gold
    stripe: 0x1A1A1A,
    accent: isGirl ? 0xFF4FA3 : 0x00D4FF,       // girl: hot pink | boy: electric cyan
    eye: 0xFFFFFF,
    pupil: 0x000000,
    cheek: isGirl ? 0xFF7AAA : 0xFFB6C1,        // girl: vivid rose | boy: subtle pink
    bow: 0xFF3E8C,                              // hot pink for girl bow
    bowtie: 0x111111,                           // jet black for boy bowtie
    lash: 0x1A1A1A,
  };

  // ── Body ────────────────────────────────────────────────────
  const bodyGeometry = new THREE.SphereGeometry(1, 48, 48);
  bodyGeometry.scale(1, 1.3, 0.9);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: colors.body,
    shininess: 150,
    emissive: colors.body,
    emissiveIntensity: 0.5,
    specular: 0xFFFFAA,
    reflectivity: 0.8,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.name = 'body';
  group.add(body);

  // ── Cheeks (bigger and rosier for girl) ─────────────────────
  const cheekRadius = isGirl ? 0.2 : 0.13;
  const cheekGeometry = new THREE.SphereGeometry(cheekRadius, 16, 16);
  const cheekMaterial = new THREE.MeshPhongMaterial({
    color: colors.cheek,
    emissive: colors.cheek,
    emissiveIntensity: isGirl ? 0.55 : 0.35,
    transparent: true,
    opacity: isGirl ? 0.95 : 0.75,
  });
  const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
  leftCheek.position.set(-0.55, 1.3, 0.6);
  group.add(leftCheek);
  const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
  rightCheek.position.set(0.55, 1.3, 0.6);
  group.add(rightCheek);

  // ── Stripes ─────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const stripeGeometry = new THREE.TorusGeometry(0.95, 0.12, 16, 32);
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: colors.stripe });
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = -0.6 + i * 0.6;
    group.add(stripe);
  }

  // ── Head ────────────────────────────────────────────────────
  const headGeometry = new THREE.SphereGeometry(0.8, 48, 48);
  const headMaterial = new THREE.MeshPhongMaterial({
    color: colors.body,
    shininess: 150,
    emissive: colors.body,
    emissiveIntensity: 0.45,
    specular: 0xFFFFAA,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.5;
  group.add(head);

  // ── Eyes ────────────────────────────────────────────────────
  const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const eyeMaterial = new THREE.MeshPhongMaterial({ color: colors.eye });
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.25, 1.6, 0.7);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.25, 1.6, 0.7);
  group.add(rightEye);

  // ── Pupils ──────────────────────────────────────────────────
  const pupilGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: colors.pupil });
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.25, 1.6, 0.8);
  group.add(leftPupil);
  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.25, 1.6, 0.8);
  group.add(rightPupil);

  // ── GIRL ONLY: Eyelashes (curved arc above each eye) ────────
  let leftLash: THREE.Mesh | undefined;
  let rightLash: THREE.Mesh | undefined;
  if (isGirl) {
    const lashGeo = new THREE.TorusGeometry(0.16, 0.018, 8, 16, Math.PI);
    const lashMat = new THREE.MeshBasicMaterial({ color: colors.lash });
    leftLash = new THREE.Mesh(lashGeo, lashMat);
    leftLash.position.set(-0.25, 1.74, 0.78);
    leftLash.rotation.z = Math.PI;
    leftLash.rotation.y = -0.2;
    group.add(leftLash);
    rightLash = new THREE.Mesh(lashGeo, lashMat);
    rightLash.position.set(0.25, 1.74, 0.78);
    rightLash.rotation.z = Math.PI;
    rightLash.rotation.y = 0.2;
    group.add(rightLash);
  }

  // ── Wings ───────────────────────────────────────────────────
  const wingGeometry = new THREE.SphereGeometry(0.6, 16, 16);
  wingGeometry.scale(1.5, 0.8, 0.1);
  const wingMaterial = new THREE.MeshPhongMaterial({
    color: 0xE0F7FF,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    shininess: 100,
    emissive: 0xCCF5FF,
    emissiveIntensity: 0.2,
  });
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.set(-1, 0.5, 0);
  leftWing.rotation.y = Math.PI / 6;
  group.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(1, 0.5, 0);
  rightWing.rotation.y = -Math.PI / 6;
  group.add(rightWing);

  // ── Antennae (boy: longer + thinner + sharper angle) ────────
  const antennaLength = isGirl ? 0.55 : 0.75;
  const antennaThickness = isGirl ? 0.035 : 0.028;
  const antennaSpread = isGirl ? Math.PI / 8 : Math.PI / 6;
  const antennaGeometry = new THREE.CylinderGeometry(antennaThickness, antennaThickness, antennaLength, 8);
  const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  leftAntenna.position.set(-0.3, 2.0 + antennaLength * 0.25, 0);
  leftAntenna.rotation.z = -antennaSpread;
  group.add(leftAntenna);
  const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  rightAntenna.position.set(0.3, 2.0 + antennaLength * 0.25, 0);
  rightAntenna.rotation.z = antennaSpread;
  group.add(rightAntenna);

  // ── Antenna bulbs (pink for girl, cyan for boy) ─────────────
  const bulbRadius = isGirl ? 0.12 : 0.09;
  const bulbGeometry = new THREE.SphereGeometry(bulbRadius, 16, 16);
  const bulbMaterial = new THREE.MeshPhongMaterial({
    color: colors.accent,
    emissive: colors.accent,
    emissiveIntensity: 0.6,
    shininess: 200,
  });
  const leftBulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  leftBulb.position.set(-0.42, 2.4 + antennaLength * 0.4, 0);
  group.add(leftBulb);
  const rightBulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  rightBulb.position.set(0.42, 2.4 + antennaLength * 0.4, 0);
  group.add(rightBulb);

  // ── GIRL ONLY: Hot pink bow on top of head ──────────────────
  let bow: THREE.Group | undefined;
  if (isGirl) {
    bow = new THREE.Group();
    const bowMat = new THREE.MeshPhongMaterial({
      color: colors.bow,
      emissive: colors.bow,
      emissiveIntensity: 0.4,
      shininess: 180,
    });
    // Two loops
    const loopGeo = new THREE.SphereGeometry(0.25, 16, 16);
    loopGeo.scale(1.2, 0.8, 0.4);
    const leftLoop = new THREE.Mesh(loopGeo, bowMat);
    leftLoop.position.set(-0.22, 0, 0);
    leftLoop.rotation.z = 0.3;
    bow.add(leftLoop);
    const rightLoop = new THREE.Mesh(loopGeo, bowMat);
    rightLoop.position.set(0.22, 0, 0);
    rightLoop.rotation.z = -0.3;
    bow.add(rightLoop);
    // Center knot
    const knotGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const knot = new THREE.Mesh(knotGeo, bowMat);
    bow.add(knot);
    bow.position.set(0, 2.3, 0.1);
    bow.scale.set(0.9, 0.9, 0.9);
    group.add(bow);
  }

  // ── BOY ONLY: Black bowtie at neck ──────────────────────────
  let bowtie: THREE.Mesh | undefined;
  if (!isGirl) {
    const tieGeo = new THREE.SphereGeometry(0.28, 16, 16);
    tieGeo.scale(1.5, 0.6, 0.4);
    const tieMat = new THREE.MeshPhongMaterial({
      color: colors.bowtie,
      shininess: 100,
      emissive: colors.bowtie,
      emissiveIntensity: 0.05,
    });
    bowtie = new THREE.Mesh(tieGeo, tieMat);
    bowtie.position.set(0, 0.85, 0.85);
    group.add(bowtie);
    // Center knot
    const knotGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const knot = new THREE.Mesh(knotGeo, tieMat);
    knot.position.set(0, 0.85, 0.95);
    group.add(knot);
  }

  return {
    body,
    leftEye,
    rightEye,
    leftPupil,
    rightPupil,
    leftWing,
    rightWing,
    leftAntenna,
    rightAntenna,
    leftBulb,
    rightBulb,
    bow,
    bowtie,
    leftLash,
    rightLash,
  };
}

/**
 * Update Jubee animation based on state
 */
function updateJubeeAnimation(
  group: THREE.Group,
  parts: JubeeParts,
  animation: string,
  mood: string,
  delta: number
) {
  const time = performance.now() * 0.001;

  // Idle float animation
  group.position.y = Math.sin(time * 2) * 0.1;

  // Gentle pulsing glow on body
  const { body } = parts;
  if (body && body.material instanceof THREE.MeshPhongMaterial) {
    // Lively sine wave pulse between 0.25 and 0.4 emissive intensity
    const pulseIntensity = 0.3 + Math.sin(time * 1.5) * 0.1;
    body.material.emissiveIntensity = pulseIntensity;
  }

  // Facial expression changes based on mood
  const { leftEye, rightEye, leftPupil, rightPupil } = parts;

  if (leftEye && rightEye && leftPupil && rightPupil) {
    let eyeScaleY = 1;
    let eyeOffsetY = 0;
    let pupilOffsetY = 0;

    // Facial expressions for different moods
    switch (mood) {
      case 'excited':
        // Wide eyes - scale up vertically
        eyeScaleY = 1.4;
        eyeOffsetY = 0.02;
        pupilOffsetY = 0.02;
        break;
      case 'tired':
        // Droopy eyes - scale down and move down
        eyeScaleY = 0.5;
        eyeOffsetY = -0.08;
        pupilOffsetY = -0.08;
        break;
      case 'curious':
        // Slightly wide eyes
        eyeScaleY = 1.2;
        eyeOffsetY = 0.01;
        pupilOffsetY = 0.01;
        break;
      case 'happy':
        // Normal happy eyes
        eyeScaleY = 1;
        eyeOffsetY = 0;
        pupilOffsetY = 0;
        break;
      default:
        eyeScaleY = 1;
        eyeOffsetY = 0;
        pupilOffsetY = 0;
    }

    // Smooth interpolation for eye scaling and position
    const lerpSpeed = delta * 5; // Smooth transition speed
    leftEye.scale.y += (eyeScaleY - leftEye.scale.y) * lerpSpeed;
    rightEye.scale.y += (eyeScaleY - rightEye.scale.y) * lerpSpeed;

    const targetLeftEyeY = 1.6 + eyeOffsetY;
    const targetRightEyeY = 1.6 + eyeOffsetY;
    leftEye.position.y += (targetLeftEyeY - leftEye.position.y) * lerpSpeed;
    rightEye.position.y += (targetRightEyeY - rightEye.position.y) * lerpSpeed;

    const targetLeftPupilY = 1.6 + pupilOffsetY;
    const targetRightPupilY = 1.6 + pupilOffsetY;
    leftPupil.position.y += (targetLeftPupilY - leftPupil.position.y) * lerpSpeed;
    rightPupil.position.y += (targetRightPupilY - rightPupil.position.y) * lerpSpeed;
  }

  // Wing flapping
  const { leftWing, rightWing } = parts;

  if (leftWing && rightWing) {
    const flapSpeed = animation === 'excited' ? 8 : 4;
    const flapAngle = Math.sin(time * flapSpeed) * 0.3;
    
    leftWing.rotation.y = Math.PI / 6 + flapAngle;
    rightWing.rotation.y = -Math.PI / 6 - flapAngle;
  }

  // Antenna animation - contextual based on mood
  const { leftAntenna, rightAntenna, leftBulb, rightBulb } = parts;

  if (leftAntenna && rightAntenna && leftBulb && rightBulb) {
    let antennaBaseRotation = -Math.PI / 8;
    let antennaWaveAmount = 0.1;
    let bulbYOffset = 0;

    // Contextual antenna animations
    switch (mood) {
      case 'curious':
        // Raised antennae - perked up
        antennaBaseRotation = -Math.PI / 6;
        antennaWaveAmount = 0.15;
        bulbYOffset = 0.15;
        break;
      case 'excited':
        // Wiggling antennae
        antennaBaseRotation = -Math.PI / 8;
        antennaWaveAmount = 0.2;
        bulbYOffset = 0.05;
        break;
      case 'tired':
        // Droopy antennae
        antennaBaseRotation = -Math.PI / 12;
        antennaWaveAmount = 0.05;
        bulbYOffset = -0.1;
        break;
      default:
        antennaBaseRotation = -Math.PI / 8;
        antennaWaveAmount = 0.1;
        bulbYOffset = 0;
    }

    const wave = Math.sin(time * 3) * antennaWaveAmount;
    const lerpSpeed = delta * 4;
    
    // Smooth antenna rotation
    const targetLeftRotZ = antennaBaseRotation + wave;
    const targetRightRotZ = -antennaBaseRotation - wave;
    leftAntenna.rotation.z += (targetLeftRotZ - leftAntenna.rotation.z) * lerpSpeed;
    rightAntenna.rotation.z += (targetRightRotZ - rightAntenna.rotation.z) * lerpSpeed;

    // Smooth bulb position
    const targetLeftBulbY = 2.5 + bulbYOffset;
    const targetRightBulbY = 2.5 + bulbYOffset;
    leftBulb.position.y += (targetLeftBulbY - leftBulb.position.y) * lerpSpeed;
    rightBulb.position.y += (targetRightBulbY - rightBulb.position.y) * lerpSpeed;
  }

  // Excited bounce
  if (animation === 'excited' || animation === 'celebration') {
    group.position.y += Math.abs(Math.sin(time * 6)) * 0.15;
    group.rotation.y = Math.sin(time * 4) * 0.2;
  }

  // Gentle rotation
  group.rotation.y += delta * 0.3;
}

export const JubeeCanvas3DDirect = memo(JubeeCanvas3DDirectComponent, (prev, next) => {
  return (
    prev.className === next.className
  );
});

// Default export for lazy loading
export default JubeeCanvas3DDirect;
