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
import * as THREE from 'three';
import { useJubeeStore } from '@/store/useJubeeStore';
import { logger } from '@/lib/logger';
import { 
  validatePosition as validateContainerPosition,
  getContainerDimensions 
} from '@/core/jubee/JubeePositionManager';

interface JubeeCanvas3DDirectProps {
  className?: string;
}

function JubeeCanvas3DDirectComponent({ className }: JubeeCanvas3DDirectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const jubeeGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number>();
  
  const { 
    containerPosition, 
    isVisible, 
    currentAnimation, 
    gender,
    currentMood,
    setContainerPosition,
  } = useJubeeStore();

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startBottom: number; startRight: number } | null>(null);
  
  // Get responsive container dimensions
  const [containerDimensions, setContainerDimensions] = useState(() => getContainerDimensions());

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setContainerDimensions(getContainerDimensions());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // DIAGNOSTIC: Component lifecycle tracking
  useEffect(() => {
    console.log('[DIAGNOSTIC] JubeeCanvas3DDirect COMPONENT MOUNTED', {
      isVisible,
      containerPosition,
      currentAnimation,
      timestamp: Date.now()
    });

    return () => {
      console.log('[DIAGNOSTIC] JubeeCanvas3DDirect COMPONENT UNMOUNTING', {
        timestamp: Date.now()
      });
    };
  }, []); // Empty deps - mount/unmount only

  // DIAGNOSTIC: Ref assignment tracking
  useEffect(() => {
    const checkInterval = setInterval(() => {
      console.log('[DIAGNOSTIC] Ref Check', {
        containerRef: containerRef.current ? 'ASSIGNED' : 'NULL',
        canvasRef: canvasRef.current ? 'ASSIGNED' : 'NULL',
        containerInDOM: containerRef.current ? document.contains(containerRef.current) : false,
        canvasInDOM: canvasRef.current ? document.contains(canvasRef.current) : false,
        timestamp: Date.now()
      });
    }, 2000);

    return () => clearInterval(checkInterval);
  }, []);

  // DIAGNOSTIC: Visibility state tracking
  useEffect(() => {
    console.log('[DIAGNOSTIC] Visibility State Changed', {
      isVisible,
      containerExists: !!containerRef.current,
      canvasExists: !!canvasRef.current,
      timestamp: Date.now()
    });
  }, [isVisible]);

  // Initialize Three.js scene
  useEffect(() => {
    console.log('[DIAGNOSTIC] Three.js Init Effect Running', {
      hasContainerRef: !!containerRef.current,
      hasCanvasRef: !!canvasRef.current,
      timestamp: Date.now()
    });

    if (!canvasRef.current || !containerRef.current) {
      console.log('[DIAGNOSTIC] Three.js Init BLOCKED - Refs not ready', {
        containerRef: containerRef.current ? 'OK' : 'MISSING',
        canvasRef: canvasRef.current ? 'OK' : 'MISSING'
      });
      return;
    }

    console.log('[Jubee3DDirect] Initializing Three.js scene');

    // Create scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      50,
      1, // Will be updated on resize
      0.1,
      1000
    );
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
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
    sceneRef.current.add(jubeeGroup);
    jubeeGroupRef.current = jubeeGroup;

    // Build Jubee geometry
    buildJubeeModel(jubeeGroup, gender);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

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

      // Update animations based on mood and state
      updateJubeeAnimation(jubeeGroup, currentAnimation, currentMood, delta);

      // Render scene
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Cleanup
    return () => {
      console.log('[Jubee3DDirect] Cleaning up Three.js scene');
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
      console.log('[Jubee3DDirect] Animation changed:', currentAnimation);
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
    console.log('[Jubee3DDirect] Drag started', dragStartRef.current);
  }, [containerPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newPosition = validateContainerPosition({
      bottom: dragStartRef.current.startBottom - deltaY,
      right: dragStartRef.current.startRight - deltaX,
    });

    setContainerPosition(newPosition);
  }, [isDragging, setContainerPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      console.log('[Jubee3DDirect] Drag ended');
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

  // DIAGNOSTIC: Render tracking
  useEffect(() => {
    console.log('[DIAGNOSTIC] JubeeCanvas3DDirect RENDER COMPLETE', {
      containerAttached: containerRef.current && document.contains(containerRef.current),
      canvasAttached: canvasRef.current && document.contains(canvasRef.current),
      timestamp: Date.now()
    });
  });

  console.log('[DIAGNOSTIC] JubeeCanvas3DDirect RENDERING', {
    isVisible,
    containerPosition,
    timestamp: Date.now()
  });

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        console.log('[DIAGNOSTIC] Container Ref Callback Executed', {
          element: el ? 'ELEMENT RECEIVED' : 'NULL',
          elementTag: el?.tagName,
          inDOM: el ? document.contains(el) : false,
          timestamp: Date.now()
        });
      }}
      className={`jubee-container ${className || ''}`}
      style={{
        position: 'fixed',
        bottom: `${containerPosition.bottom}px`,
        right: `${containerPosition.right}px`,
        width: `${containerDimensions.width}px`,
        height: `${containerDimensions.height}px`,
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transition: isDragging ? 'none' : 'opacity 0.3s ease',
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      data-jubee-container="true"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          console.log('[DIAGNOSTIC] Canvas Ref Callback Executed', {
            element: el ? 'ELEMENT RECEIVED' : 'NULL',
            elementTag: el?.tagName,
            inDOM: el ? document.contains(el) : false,
            timestamp: Date.now()
          });
        }}
        className="jubee-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}

/**
 * Build the Jubee 3D model
 */
function buildJubeeModel(group: THREE.Group, gender: 'male' | 'female') {
  // Get colors based on gender - ULTRA bright, vibrant, lively bee colors
  const colors = {
    body: gender === 'male' ? 0xFFD700 : 0xFFC300,  // Pure gold / bright amber yellow
    stripe: 0x2C2C2C,  // Dark charcoal for strong contrast
    accent: gender === 'male' ? 0x00FFFF : 0xFFAA00,  // Cyan / orange-yellow
    eye: 0xFFFFFF,
    pupil: 0x000000,
  };

  // Body (ellipsoid)
  const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
  bodyGeometry.scale(1, 1.3, 0.9);
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: colors.body,
    shininess: 100,
    emissive: colors.body,
    emissiveIntensity: 0.3,
    specular: 0xFFFFFF,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.name = 'body';
  group.add(body);

  // Stripes
  for (let i = 0; i < 3; i++) {
    const stripeGeometry = new THREE.TorusGeometry(0.95, 0.12, 16, 32);
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: colors.stripe });
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = -0.6 + i * 0.6;
    stripe.name = `stripe-${i}`;
    group.add(stripe);
  }

  // Head
  const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
  const headMaterial = new THREE.MeshPhongMaterial({ 
    color: colors.body,
    shininess: 100,
    emissive: colors.body,
    emissiveIntensity: 0.25,
    specular: 0xFFFFFF,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.5;
  head.name = 'head';
  group.add(head);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const eyeMaterial = new THREE.MeshPhongMaterial({ color: colors.eye });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.25, 1.6, 0.7);
  leftEye.name = 'leftEye';
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.25, 1.6, 0.7);
  rightEye.name = 'rightEye';
  group.add(rightEye);

  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: colors.pupil });
  
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.25, 1.6, 0.8);
  leftPupil.name = 'leftPupil';
  group.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.25, 1.6, 0.8);
  rightPupil.name = 'rightPupil';
  group.add(rightPupil);

  // Wings
  const wingGeometry = new THREE.SphereGeometry(0.6, 16, 16);
  wingGeometry.scale(1.5, 0.8, 0.1);
  const wingMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xE0F7FF,  // Bright cyan-white for iridescent wings
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
  leftWing.name = 'leftWing';
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(1, 0.5, 0);
  rightWing.rotation.y = -Math.PI / 6;
  rightWing.name = 'rightWing';
  group.add(rightWing);

  // Antennae
  const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
  const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

  const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  leftAntenna.position.set(-0.3, 2.1, 0);
  leftAntenna.rotation.z = -Math.PI / 8;
  leftAntenna.name = 'leftAntenna';
  group.add(leftAntenna);

  const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  rightAntenna.position.set(0.3, 2.1, 0);
  rightAntenna.rotation.z = Math.PI / 8;
  rightAntenna.name = 'rightAntenna';
  group.add(rightAntenna);

  // Antenna bulbs
  const bulbGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const bulbMaterial = new THREE.MeshPhongMaterial({ color: colors.accent });

  const leftBulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  leftBulb.position.set(-0.42, 2.5, 0);
  leftBulb.name = 'leftBulb';
  group.add(leftBulb);

  const rightBulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  rightBulb.position.set(0.42, 2.5, 0);
  rightBulb.name = 'rightBulb';
  group.add(rightBulb);
}

/**
 * Update Jubee animation based on state
 */
function updateJubeeAnimation(
  group: THREE.Group,
  animation: string,
  mood: string,
  delta: number
) {
  const time = performance.now() * 0.001;

  // Idle float animation
  group.position.y = Math.sin(time * 2) * 0.1;

  // Gentle pulsing glow on body
  const body = group.getObjectByName('body') as THREE.Mesh;
  if (body && body.material instanceof THREE.MeshPhongMaterial) {
    // Lively sine wave pulse between 0.25 and 0.4 emissive intensity
    const pulseIntensity = 0.3 + Math.sin(time * 1.5) * 0.1;
    body.material.emissiveIntensity = pulseIntensity;
  }

  // Wing flapping
  const leftWing = group.getObjectByName('leftWing');
  const rightWing = group.getObjectByName('rightWing');

  if (leftWing && rightWing) {
    const flapSpeed = animation === 'excited' ? 8 : 4;
    const flapAngle = Math.sin(time * flapSpeed) * 0.3;
    
    leftWing.rotation.y = Math.PI / 6 + flapAngle;
    rightWing.rotation.y = -Math.PI / 6 - flapAngle;
  }

  // Antenna wave
  const leftAntenna = group.getObjectByName('leftAntenna');
  const rightAntenna = group.getObjectByName('rightAntenna');

  if (leftAntenna && rightAntenna) {
    const wave = Math.sin(time * 3) * 0.1;
    leftAntenna.rotation.z = -Math.PI / 8 + wave;
    rightAntenna.rotation.z = Math.PI / 8 - wave;
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
