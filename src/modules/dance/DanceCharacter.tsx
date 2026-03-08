/**
 * JubeeDance 3D Character Component – Premium Edition
 *
 * MeshPhysicalMaterial with clearcoat + iridescence, environment mapping,
 * 64-segment geometry, eye blinks, antenna spring physics, beat-pulse,
 * dynamic combo-tier spotlight, contact shadows, and sparkle bursts.
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
  comboTier?: 'normal' | 'warm' | 'fire' | 'legendary';
  bpm?: number;
}

// Combo-tier spotlight colors (HSL → hex)
const TIER_COLORS: Record<string, number> = {
  normal: 0xfff1d6,
  warm: 0xffe29c,
  fire: 0xff8a50,
  legendary: 0xff4ecb,
};

function DanceCharacterComponent({
  animation,
  isStumbling,
  isPerfect,
  isPaused,
  reducedMotion,
  comboTier = 'normal',
  bpm = 100,
}: DanceCharacterProps) {
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
  const comboTierRef = useRef(comboTier);
  const bpmRef = useRef(bpm);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const glowRingRef = useRef<THREE.Mesh | null>(null);
  const leftPupilRef = useRef<THREE.Mesh | null>(null);
  const rightPupilRef = useRef<THREE.Mesh | null>(null);
  const leftAntennaRef = useRef<THREE.Mesh | null>(null);
  const rightAntennaRef = useRef<THREE.Mesh | null>(null);
  const leftTipRef = useRef<THREE.Mesh | null>(null);
  const rightTipRef = useRef<THREE.Mesh | null>(null);

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
    if (shouldRender) startLoopRef.current();
    else stopLoopRef.current();
  };

  useEffect(() => {
    animationStateRef.current.animation = animation;
    animationStateRef.current.time = 0;
  }, [animation]);

  useEffect(() => { updateRenderState({ isPaused }); }, [isPaused]);
  useEffect(() => { reducedMotionRef.current = !!reducedMotion; }, [reducedMotion]);
  useEffect(() => { comboTierRef.current = comboTier; }, [comboTier]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  useEffect(() => {
    if (reducedMotion) { lastPerfectRef.current = false; return; }
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

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfff4e6);
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Environment Map (PMREMGenerator) ──
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xfff8ee);
    const envLight1 = new THREE.DirectionalLight(0xfff1d6, 2);
    envLight1.position.set(5, 5, 5);
    envScene.add(envLight1);
    const envLight2 = new THREE.DirectionalLight(0xd6e8ff, 1);
    envLight2.position.set(-5, 3, -5);
    envScene.add(envLight2);
    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
    pmremGenerator.dispose();

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0xd6cec0, 0.5);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(4, 7, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfff1d6, 0.5);
    fillLight.position.set(-4, 5, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd7a3, 0.6);
    rimLight.position.set(-2, 6, -6);
    scene.add(rimLight);

    // Dynamic combo spotlight
    const spotlight = new THREE.SpotLight(0xfff1d6, 1, 12, Math.PI / 5, 0.4, 1);
    spotlight.position.set(0, 6, 2);
    spotlight.target.position.set(0, 1, 0);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.set(512, 512);
    scene.add(spotlight);
    scene.add(spotlight.target);
    spotlightRef.current = spotlight;

    // ── Stage ──
    const stageGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.15, 64);
    const stageMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffe8c0,
      metalness: 0.1,
      roughness: 0.6,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      envMap,
    });
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.y = -0.075;
    stage.receiveShadow = true;
    scene.add(stage);

    // Contact shadow (ground plane)
    const contactGeometry = new THREE.PlaneGeometry(4, 4);
    const contactMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(contactGeometry, contactMaterial);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // ── Character ──
    const character = new THREE.Group();
    characterRef.current = character;

    // Body (64 segments, physical material)
    const bodyGeometry = new THREE.SphereGeometry(0.6, 64, 64);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFD700,
      metalness: 0.05,
      roughness: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      envMap,
      envMapIntensity: 0.6,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    character.add(body);

    // Stripes
    for (let i = 0; i < 3; i++) {
      const stripeGeometry = new THREE.TorusGeometry(0.55, 0.06, 12, 64);
      const stripeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a1a,
        roughness: 0.5,
        metalness: 0.1,
        envMap,
        envMapIntensity: 0.3,
      });
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = 0.85 + i * 0.15;
      stripe.rotation.x = Math.PI / 2;
      character.add(stripe);
    }

    // Head (64 segments)
    const headGeometry = new THREE.SphereGeometry(0.35, 64, 64);
    const headMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFD700,
      metalness: 0.05,
      roughness: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      envMap,
      envMapIntensity: 0.6,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    character.add(head);

    // Eyes (32 segments)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const eyeWhiteMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      clearcoat: 0.8,
      envMap,
    });
    const pupilMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      envMap,
      envMapIntensity: 0.2,
    });

    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-0.12, 1.85, 0.28);
    leftEyeWhite.scale.set(1, 1.2, 0.5);
    character.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(0.12, 1.85, 0.28);
    rightEyeWhite.scale.set(1, 1.2, 0.5);
    character.add(rightEyeWhite);

    const pupilGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.12, 1.85, 0.35);
    leftPupilRef.current = leftPupil;
    character.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.12, 1.85, 0.35);
    rightPupilRef.current = rightPupil;
    character.add(rightPupil);

    // Smile
    const smileGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 24, Math.PI);
    const smileMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 1.72, 0.3);
    smile.rotation.x = Math.PI;
    character.add(smile);

    // Antennae
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 12);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    leftAntenna.position.set(-0.15, 2.15, 0);
    leftAntenna.rotation.z = -0.3;
    leftAntennaRef.current = leftAntenna;
    character.add(leftAntenna);

    const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    rightAntenna.position.set(0.15, 2.15, 0);
    rightAntenna.rotation.z = 0.3;
    rightAntennaRef.current = rightAntenna;
    character.add(rightAntenna);

    // Antenna tips (shiny)
    const tipGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const tipMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFD700,
      emissive: 0xffa000,
      emissiveIntensity: 0.3,
      metalness: 0.4,
      roughness: 0.2,
      clearcoat: 1,
      envMap,
    });
    const leftTip = new THREE.Mesh(tipGeometry, tipMaterial);
    leftTip.position.set(-0.23, 2.35, 0);
    leftTipRef.current = leftTip;
    character.add(leftTip);

    const rightTip = new THREE.Mesh(tipGeometry, tipMaterial);
    rightTip.position.set(0.23, 2.35, 0);
    rightTipRef.current = rightTip;
    character.add(rightTip);

    // Wings (iridescent physical material)
    const wingGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const wingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xE0F7FF,
      transparent: true,
      opacity: 0.65,
      transmission: 0.6,
      roughness: 0.15,
      metalness: 0.1,
      iridescence: 1,
      iridescenceIOR: 1.3,
      clearcoat: 1,
      envMap,
      envMapIntensity: 0.8,
      side: THREE.DoubleSide,
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
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.4, 8, 12);
    const armMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFD700,
      roughness: 0.4,
      clearcoat: 0.4,
      envMap,
    });

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
    const legGeometry = new THREE.CapsuleGeometry(0.1, 0.4, 8, 12);
    const legMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.05,
      envMap,
      envMapIntensity: 0.2,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.3, 0);
    leftLeg.name = 'leftLeg';
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.3, 0);
    rightLeg.name = 'rightLeg';
    character.add(rightLeg);

    // Glow ring for perfect streaks
    const glowRingGeometry = new THREE.RingGeometry(0.9, 1.1, 64);
    const glowRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glowRing = new THREE.Mesh(glowRingGeometry, glowRingMaterial);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.05;
    glowRingRef.current = glowRing;
    scene.add(glowRing);

    // Sparkle burst (30 particles)
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparkleCount = 30;
    const sparklePositions = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount; i++) {
      const radius = 0.3 + Math.random() * 0.4;
      const angle = Math.random() * Math.PI * 2;
      sparklePositions[i * 3] = Math.cos(angle) * radius;
      sparklePositions[i * 3 + 1] = Math.random() * 0.5;
      sparklePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));

    const sparkleMaterial = new THREE.PointsMaterial({
      color: 0xffe29c,
      size: 0.1,
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

    // ── Animation Loop ──
    let blinkTimer = 0;
    let isBlinking = false;

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

      if (lastFrameRef.current === 0) lastFrameRef.current = time;
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

      // ── Beat pulse ──
      if (!reduceMotion) {
        const beatInterval = 60 / bpmRef.current;
        const beatPhase = (t % beatInterval) / beatInterval;
        const pulseScale = 1 + Math.max(0, 0.03 * (1 - beatPhase * 4)) * motionScale;
        body.scale.set(pulseScale, pulseScale, pulseScale);
      }

      // ── Eye blinks ──
      blinkTimer += delta;
      if (!isBlinking && blinkTimer > 2.5 + Math.random() * 2) {
        isBlinking = true;
        blinkTimer = 0;
      }
      if (isBlinking) {
        const blinkProgress = blinkTimer / 0.15;
        if (blinkProgress < 1) {
          const scaleY = 1 - Math.sin(blinkProgress * Math.PI) * 0.9;
          leftPupilRef.current?.scale.set(1, Math.max(0.1, scaleY), 1);
          rightPupilRef.current?.scale.set(1, Math.max(0.1, scaleY), 1);
          leftEyeWhite.scale.set(1, 1.2 * Math.max(0.2, scaleY), 0.5);
          rightEyeWhite.scale.set(1, 1.2 * Math.max(0.2, scaleY), 0.5);
        } else {
          leftPupilRef.current?.scale.set(1, 1, 1);
          rightPupilRef.current?.scale.set(1, 1, 1);
          leftEyeWhite.scale.set(1, 1.2, 0.5);
          rightEyeWhite.scale.set(1, 1.2, 0.5);
          isBlinking = false;
        }
      }

      // ── Antenna spring bounce ──
      if (!reduceMotion && leftAntennaRef.current && rightAntennaRef.current) {
        const springBounce = Math.sin(t * 6) * 0.08;
        leftAntennaRef.current.rotation.x = springBounce;
        rightAntennaRef.current.rotation.x = springBounce;
        if (leftTipRef.current && rightTipRef.current) {
          leftTipRef.current.position.y = 2.35 + springBounce * 0.3;
          rightTipRef.current.position.y = 2.35 + springBounce * 0.3;
        }
      }

      // ── Spotlight color from combo tier ──
      if (spotlightRef.current) {
        const targetColor = TIER_COLORS[comboTierRef.current] ?? TIER_COLORS.normal;
        spotlightRef.current.color.lerp(new THREE.Color(targetColor), delta * 3);
        const intensity = comboTierRef.current === 'legendary' ? 2.5 :
          comboTierRef.current === 'fire' ? 1.8 :
          comboTierRef.current === 'warm' ? 1.3 : 1;
        spotlightRef.current.intensity += (intensity - spotlightRef.current.intensity) * delta * 3;
      }

      // ── Glow ring for fire/legendary ──
      if (glowRingRef.current) {
        const glowMat = glowRingRef.current.material as THREE.MeshBasicMaterial;
        const targetOpacity = comboTierRef.current === 'legendary' ? 0.5 :
          comboTierRef.current === 'fire' ? 0.3 : 0;
        glowMat.opacity += (targetOpacity - glowMat.opacity) * delta * 4;
        if (glowMat.opacity > 0.01) {
          glowRingRef.current.rotation.z += delta * 0.5;
          const gColor = comboTierRef.current === 'legendary' ? 0xff4ecb : 0xff8a50;
          glowMat.color.lerp(new THREE.Color(gColor), delta * 3);
        }
      }

      // Reset character
      character.position.set(0, 0, 0);
      character.rotation.set(0, 0, 0);

      // Wing flutter
      const lw = character.getObjectByName('leftWing') as THREE.Mesh | undefined;
      const rw = character.getObjectByName('rightWing') as THREE.Mesh | undefined;
      if (lw && rw) {
        lw.rotation.z = 0.5 + Math.sin(t * wingSpeed) * 0.3 * motionScale;
        rw.rotation.z = -0.5 - Math.sin(t * wingSpeed) * 0.3 * motionScale;
      }

      const la = character.getObjectByName('leftArm') as THREE.Mesh | undefined;
      const ra = character.getObjectByName('rightArm') as THREE.Mesh | undefined;
      const ll = character.getObjectByName('leftLeg') as THREE.Mesh | undefined;
      const rl = character.getObjectByName('rightLeg') as THREE.Mesh | undefined;

      switch (currentAnim) {
        case 'idle':
          character.position.y = Math.sin(t * 2) * 0.05 * motionScale;
          break;
        case 'dance-up':
          character.position.y = Math.abs(Math.sin(t * 8)) * 0.5 * motionScale;
          if (la) la.rotation.z = -1.5 * motionScale;
          if (ra) ra.rotation.z = 1.5 * motionScale;
          break;
        case 'dance-down':
          character.position.y = -Math.abs(Math.sin(t * 6)) * 0.2 * motionScale;
          if (la) la.rotation.z = 1.2 * motionScale;
          if (ra) ra.rotation.z = -1.2 * motionScale;
          break;
        case 'dance-left':
          character.position.x = -0.3 * motionScale;
          character.rotation.z = 0.2 * motionScale;
          if (ll) ll.rotation.x = -0.3 * motionScale;
          if (la) la.rotation.z = -1 * motionScale;
          break;
        case 'dance-right':
          character.position.x = 0.3 * motionScale;
          character.rotation.z = -0.2 * motionScale;
          if (rl) rl.rotation.x = -0.3 * motionScale;
          if (ra) ra.rotation.z = 1 * motionScale;
          break;
        case 'spin':
          character.rotation.y = t * 10 * motionScale;
          character.position.y = 0.1 * motionScale;
          break;
        case 'jump':
          character.position.y = Math.abs(Math.sin(t * 5)) * 1 * motionScale;
          if (la) la.rotation.z = -2 * motionScale;
          if (ra) ra.rotation.z = 2 * motionScale;
          break;
        case 'stumble':
          character.rotation.z = Math.sin(t * 20) * 0.5 * motionScale;
          character.rotation.x = 0.3 * motionScale;
          character.position.y = -0.1 * motionScale;
          break;
        case 'celebrate':
          character.position.y = Math.sin(t * 8) * 0.3 * motionScale;
          character.rotation.y = Math.sin(t * 4) * 0.3 * motionScale;
          if (la) la.rotation.z = -1.5 * motionScale + Math.sin(t * 10) * 0.5 * motionScale;
          if (ra) ra.rotation.z = 1.5 * motionScale + Math.sin(t * 10 + 1) * 0.5 * motionScale;
          break;
        case 'wave':
          character.position.y = Math.sin(t * 2) * 0.05 * motionScale;
          if (ra) ra.rotation.z = -1.2 * motionScale + Math.sin(t * 8) * 0.5 * motionScale;
          break;
      }

      // Sparkle burst
      if (!reduceMotion && sparkleRef.current && sparkleMaterialRef.current) {
        const age = (time - sparkleStartRef.current) / 1000;
        if (age >= 0 && age <= 0.6) {
          sparkleRef.current.visible = true;
          const scale = 1 + age * 2;
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
      updateRenderState({ isVisible: document.visibilityState === 'visible' });
    };
    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => updateRenderState({ isInView: !!entries[0]?.isIntersecting }),
        { threshold: 0.1 }
      );
      observer.observe(container);
    }

    updateRenderState({ isPaused });
    logger.info('[DanceCharacter] Premium 3D scene initialized');

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer) observer.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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
