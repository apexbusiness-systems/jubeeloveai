/**
 * JubeeDance 3D Character Component
 *
 * StageLight: frame-time animation, key/fill/rim lighting, sparkles,
 * and render loop pausing for hidden/offscreen/paused states.
 */

import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import type { DanceAnimation } from './types';
import { logger } from '@/lib/logger';

interface DanceCharacterProps {
  animation: DanceAnimation;
  isStumbling: boolean;
  isPerfect: boolean;
  isPaused: boolean;
  reducedMotion?: boolean;
}

function DanceCharacterComponent({ animation, isStumbling, isPerfect, isPaused, reducedMotion }: DanceCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef({ animation, time: 0 });
  const lastFrameRef = useRef<number>(0);
  const sparkleRef = useRef<THREE.Points | null>(null);
  const sparkleMaterialRef = useRef<THREE.PointsMaterial | null>(null);
  const sparkleStartRef = useRef<number>(0);
  const lastPerfectRef = useRef<boolean>(false);
  const reducedMotionRef = useRef<boolean>(!!reducedMotion);
  const renderStateRef = useRef({
    isPaused,
    isVisible: true,
    isInView: true,
  });
  const startLoopRef = useRef<() => void>(() => {});
  const stopLoopRef = useRef<() => void>(() => {});

  const updateRenderState = (partial: Partial<typeof renderStateRef.current>) => {
    renderStateRef.current = { ...renderStateRef.current, ...partial };
    const shouldRender =
      !renderStateRef.current.isPaused && renderStateRef.current.isVisible && renderStateRef.current.isInView;
    if (shouldRender) {
      startLoopRef.current();
    } else {
      stopLoopRef.current();
    }
  };

  // Update animation state ref when props change
  useEffect(() => {
    animationStateRef.current.animation = animation;
    animationStateRef.current.time = 0;
  }, [animation]);

  useEffect(() => {
    updateRenderState({ isPaused });
  }, [isPaused]);

  useEffect(() => {
    reducedMotionRef.current = !!reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      lastPerfectRef.current = false;
      return;
    }
    if (isPerfect && !lastPerfectRef.current) {
      sparkleStartRef.current = performance.now();
      if (sparkleRef.current && sparkleMaterialRef.current) {
        sparkleRef.current.visible = true;
        sparkleMaterialRef.current.opacity = 1;
      }
    }
    lastPerfectRef.current = isPerfect;
  }, [isPerfect, reducedMotion]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfff4e6);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(4, 7, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(512, 512);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfff1d6, 0.45);
    fillLight.position.set(-4, 5, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd7a3, 0.55);
    rimLight.position.set(-2, 6, -6);
    scene.add(rimLight);

    // Ground/Stage
    const stageGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32);
    const stageMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe2a8,
      metalness: 0.15,
      roughness: 0.75,
    });
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.y = -0.1;
    stage.receiveShadow = true;
    scene.add(stage);

    // Character - Jubee-style dancing bee
    const character = new THREE.Group();
    characterRef.current = character;

    // Body (yellow sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffd54a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    character.add(body);

    // Stripes
    for (let i = 0; i < 3; i++) {
      const stripeGeometry = new THREE.TorusGeometry(0.55, 0.06, 8, 32);
      const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = 0.85 + i * 0.15;
      stripe.rotation.x = Math.PI / 2;
      character.add(stripe);
    }

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffd54a });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    character.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-0.12, 1.85, 0.28);
    leftEyeWhite.scale.set(1, 1.2, 0.5);
    character.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(0.12, 1.85, 0.28);
    rightEyeWhite.scale.set(1, 1.2, 0.5);
    character.add(rightEyeWhite);

    const pupilGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.12, 1.85, 0.35);
    character.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.12, 1.85, 0.35);
    character.add(rightPupil);

    // Smile
    const smileGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 16, Math.PI);
    const smileMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 1.72, 0.3);
    smile.rotation.x = Math.PI;
    character.add(smile);

    // Antennae
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    leftAntenna.position.set(-0.15, 2.15, 0);
    leftAntenna.rotation.z = -0.3;
    character.add(leftAntenna);

    const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    rightAntenna.position.set(0.15, 2.15, 0);
    rightAntenna.rotation.z = 0.3;
    character.add(rightAntenna);

    // Antenna tips
    const tipGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const leftTip = new THREE.Mesh(tipGeometry, antennaMaterial);
    leftTip.position.set(-0.23, 2.35, 0);
    character.add(leftTip);

    const rightTip = new THREE.Mesh(tipGeometry, antennaMaterial);
    rightTip.position.set(0.23, 2.35, 0);
    character.add(rightTip);

    // Wings
    const wingGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 1.2, -0.2);
    leftWing.scale.set(0.3, 0.7, 0.1);
    leftWing.rotation.z = 0.5;
    leftWing.name = 'leftWing';
    character.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 1.2, -0.2);
    rightWing.scale.set(0.3, 0.7, 0.1);
    rightWing.rotation.z = -0.5;
    rightWing.name = 'rightWing';
    character.add(rightWing);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.4, 8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffd54a });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 1, 0);
    leftArm.rotation.z = 0.5;
    leftArm.name = 'leftArm';
    character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 1, 0);
    rightArm.rotation.z = -0.5;
    rightArm.name = 'rightArm';
    character.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.1, 0.4, 8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.3, 0);
    leftLeg.name = 'leftLeg';
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.3, 0);
    rightLeg.name = 'rightLeg';
    character.add(rightLeg);

    // Sparkle burst
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparkleCount = 18;
    const sparklePositions = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount; i++) {
      const radius = 0.4 + Math.random() * 0.2;
      const angle = Math.random() * Math.PI * 2;
      sparklePositions[i * 3] = Math.cos(angle) * radius;
      sparklePositions[i * 3 + 1] = Math.random() * 0.4;
      sparklePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));

    const sparkleMaterial = new THREE.PointsMaterial({
      color: 0xffe29c,
      size: 0.08,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    sparkleMaterialRef.current = sparkleMaterial;

    const sparkle = new THREE.Points(sparkleGeometry, sparkleMaterial);
    sparkle.position.set(0, 1.3, 0);
    sparkle.visible = false;
    sparkleRef.current = sparkle;
    scene.add(sparkle);

    scene.add(character);

    // Animation loop
    function animate(time: number) {
      if (!renderStateRef.current.isVisible || !renderStateRef.current.isInView || renderStateRef.current.isPaused) {
        animationFrameRef.current = null;
        return;
      }

      const minFrameMs =
        typeof navigator !== 'undefined' && (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined
          ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4
            ? 1000 / 30
            : 1000 / 60
          : 1000 / 60;

      if (lastFrameRef.current === 0) {
        lastFrameRef.current = time;
      }

      const elapsedMs = time - lastFrameRef.current;
      if (elapsedMs < minFrameMs) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const delta = elapsedMs / 1000;
      lastFrameRef.current = time;

      const { animation: currentAnim } = animationStateRef.current;
      const reduceMotion = reducedMotionRef.current;
      const motionScale = reduceMotion ? 0.45 : 1;
      const wingSpeed = reduceMotion ? 7 : 15;
      animationStateRef.current.time += delta;

      const t = animationStateRef.current.time;

      // Reset character position
      character.position.set(0, 0, 0);
      character.rotation.set(0, 0, 0);

      // Wing flutter (always active)
      if (leftWing && rightWing) {
        leftWing.rotation.z = 0.5 + Math.sin(t * wingSpeed) * 0.3 * motionScale;
        rightWing.rotation.z = -0.5 - Math.sin(t * wingSpeed) * 0.3 * motionScale;
      }

      // Apply animation based on current state
      switch (currentAnim) {
        case 'idle':
          character.position.y = Math.sin(t * 2) * 0.05 * motionScale;
          break;

        case 'dance-up':
          character.position.y = Math.abs(Math.sin(t * 8)) * 0.5 * motionScale;
          if (leftArm) leftArm.rotation.z = -1.5 * motionScale;
          if (rightArm) rightArm.rotation.z = 1.5 * motionScale;
          break;

        case 'dance-down':
          character.position.y = -Math.abs(Math.sin(t * 6)) * 0.2 * motionScale;
          if (leftArm) leftArm.rotation.z = 1.2 * motionScale;
          if (rightArm) rightArm.rotation.z = -1.2 * motionScale;
          break;

        case 'dance-left':
          character.position.x = -0.3 * motionScale;
          character.rotation.z = 0.2 * motionScale;
          if (leftLeg) leftLeg.rotation.x = -0.3 * motionScale;
          if (leftArm) leftArm.rotation.z = -1 * motionScale;
          break;

        case 'dance-right':
          character.position.x = 0.3 * motionScale;
          character.rotation.z = -0.2 * motionScale;
          if (rightLeg) rightLeg.rotation.x = -0.3 * motionScale;
          if (rightArm) rightArm.rotation.z = 1 * motionScale;
          break;

        case 'spin':
          character.rotation.y = t * 10 * motionScale;
          character.position.y = 0.1 * motionScale;
          break;

        case 'jump':
          character.position.y = Math.abs(Math.sin(t * 5)) * 1 * motionScale;
          if (leftArm) leftArm.rotation.z = -2 * motionScale;
          if (rightArm) rightArm.rotation.z = 2 * motionScale;
          break;

        case 'stumble':
          character.rotation.z = Math.sin(t * 20) * 0.5 * motionScale;
          character.rotation.x = 0.3 * motionScale;
          character.position.y = -0.1 * motionScale;
          break;

        case 'celebrate':
          character.position.y = Math.sin(t * 8) * 0.3 * motionScale;
          character.rotation.y = Math.sin(t * 4) * 0.3 * motionScale;
          if (leftArm) leftArm.rotation.z = -1.5 * motionScale + Math.sin(t * 10) * 0.5 * motionScale;
          if (rightArm) rightArm.rotation.z = 1.5 * motionScale + Math.sin(t * 10 + 1) * 0.5 * motionScale;
          break;

        case 'wave':
          character.position.y = Math.sin(t * 2) * 0.05 * motionScale;
          if (rightArm) rightArm.rotation.z = -1.2 * motionScale + Math.sin(t * 8) * 0.5 * motionScale;
          break;
      }

      // Sparkle burst animation
      if (!reduceMotion && sparkleRef.current && sparkleMaterialRef.current) {
        const age = (time - sparkleStartRef.current) / 1000;
        if (age >= 0 && age <= 0.6) {
          sparkleRef.current.visible = true;
          const scale = 1 + age * 1.6;
          sparkleRef.current.scale.set(scale, scale, scale);
          sparkleMaterialRef.current.opacity = Math.max(0, 1 - age / 0.6);
        } else {
          sparkleRef.current.visible = false;
          sparkleMaterialRef.current.opacity = 0;
        }
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    startLoopRef.current = () => {
      if (animationFrameRef.current === null) {
        lastFrameRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    stopLoopRef.current = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    const handleVisibility = () => {
      const isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
      updateRenderState({ isVisible });
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
      handleVisibility();
    }

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          updateRenderState({ isInView: !!entry?.isIntersecting });
        },
        { threshold: 0.1 }
      );
      observer.observe(container);
    }

    updateRenderState({ isPaused });

    logger.info('[DanceCharacter] 3D scene initialized');

    return () => {
      window.removeEventListener('resize', handleResize);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (observer) {
        observer.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`dance-character w-full h-full rounded-2xl overflow-hidden ${
        isStumbling ? 'dance-stumble' : ''
      } ${isPerfect ? 'dance-perfect' : ''}`}
    />
  );
}

export const DanceCharacter = memo(DanceCharacterComponent);

