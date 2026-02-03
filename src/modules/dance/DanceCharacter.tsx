/**
 * JubeeDance 3D Character Component
 * 
 * Renders the dancing character using Three.js directly.
 * Proprietary animation system for dance moves.
 */

import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import type { DanceAnimation } from './types';
import { logger } from '@/lib/logger';

interface DanceCharacterProps {
  animation: DanceAnimation;
  isStumbling: boolean;
  isPerfect: boolean;
}

function DanceCharacterComponent({ animation, isStumbling, isPerfect }: DanceCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef({ animation, time: 0 });

  // Update animation state ref when props change
  useEffect(() => {
    animationStateRef.current.animation = animation;
    animationStateRef.current.time = 0;
  }, [animation]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground/Stage
    const stageGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32);
    const stageMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      metalness: 0.3,
      roughness: 0.7,
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
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    character.add(body);

    // Stripes
    for (let i = 0; i < 3; i++) {
      const stripeGeometry = new THREE.TorusGeometry(0.55, 0.06, 8, 32);
      const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = 0.85 + i * 0.15;
      stripe.rotation.x = Math.PI / 2;
      character.add(stripe);
    }

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    character.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });

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
    const smileMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 1.72, 0.3);
    smile.rotation.x = Math.PI;
    character.add(smile);

    // Antennae
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
    
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
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });

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
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.3, 0);
    leftLeg.name = 'leftLeg';
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.3, 0);
    rightLeg.name = 'rightLeg';
    character.add(rightLeg);

    scene.add(character);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const { animation: currentAnim } = animationStateRef.current;
      const delta = 0.016; // ~60fps
      animationStateRef.current.time += delta;

      const t = animationStateRef.current.time;

      // Reset character position
      character.position.set(0, 0, 0);
      character.rotation.set(0, 0, 0);

      // Wing flutter (always active)
      if (leftWing && rightWing) {
        leftWing.rotation.z = 0.5 + Math.sin(t * 15) * 0.3;
        rightWing.rotation.z = -0.5 - Math.sin(t * 15) * 0.3;
      }

      // Apply animation based on current state
      switch (currentAnim) {
        case 'idle':
          // Gentle bob
          character.position.y = Math.sin(t * 2) * 0.05;
          break;

        case 'dance-up':
          // Jump up with arms raised
          character.position.y = Math.abs(Math.sin(t * 8)) * 0.5;
          if (leftArm) leftArm.rotation.z = -1.5;
          if (rightArm) rightArm.rotation.z = 1.5;
          break;

        case 'dance-down':
          // Squat down with arms out
          character.position.y = -Math.abs(Math.sin(t * 6)) * 0.2;
          if (leftArm) leftArm.rotation.z = 1.2;
          if (rightArm) rightArm.rotation.z = -1.2;
          break;

        case 'dance-left':
          // Lean and step left
          character.position.x = -0.3;
          character.rotation.z = 0.2;
          if (leftLeg) leftLeg.rotation.x = -0.3;
          if (leftArm) leftArm.rotation.z = -1;
          break;

        case 'dance-right':
          // Lean and step right
          character.position.x = 0.3;
          character.rotation.z = -0.2;
          if (rightLeg) rightLeg.rotation.x = -0.3;
          if (rightArm) rightArm.rotation.z = 1;
          break;

        case 'spin':
          // Full spin
          character.rotation.y = t * 10;
          character.position.y = 0.1;
          break;

        case 'jump':
          // Big jump
          character.position.y = Math.abs(Math.sin(t * 5)) * 1;
          if (leftArm) leftArm.rotation.z = -2;
          if (rightArm) rightArm.rotation.z = 2;
          break;

        case 'stumble':
          // Wobble and fall
          character.rotation.z = Math.sin(t * 20) * 0.5;
          character.rotation.x = 0.3;
          character.position.y = -0.1;
          break;

        case 'celebrate':
          // Victory dance
          character.position.y = Math.sin(t * 8) * 0.3;
          character.rotation.y = Math.sin(t * 4) * 0.3;
          if (leftArm) leftArm.rotation.z = -1.5 + Math.sin(t * 10) * 0.5;
          if (rightArm) rightArm.rotation.z = 1.5 + Math.sin(t * 10 + 1) * 0.5;
          break;

        case 'wave':
          // Friendly wave
          character.position.y = Math.sin(t * 2) * 0.05;
          if (rightArm) rightArm.rotation.z = -1.2 + Math.sin(t * 8) * 0.5;
          break;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    logger.info('[DanceCharacter] 3D scene initialized');

    return () => {
      window.removeEventListener('resize', handleResize);
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
      className={`w-full h-full rounded-2xl overflow-hidden ${
        isStumbling ? 'ring-4 ring-red-500 animate-shake' : ''
      } ${isPerfect ? 'ring-4 ring-yellow-400 animate-glow' : ''}`}
    />
  );
}

export const DanceCharacter = memo(DanceCharacterComponent);
