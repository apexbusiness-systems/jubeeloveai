import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { renderHook } from '@testing-library/react';
import React from 'react';

// Simplified benchmark for getObjectByName vs Object Reference in a render loop
describe('DanceCharacter Animation Loop Optimization', () => {
  it('should be faster to use references than getObjectByName', () => {
    const group = new THREE.Group();

    // Create the hierarchy
    const leftWing = new THREE.Mesh();
    leftWing.name = 'leftWing';
    group.add(leftWing);

    const rightWing = new THREE.Mesh();
    rightWing.name = 'rightWing';
    group.add(rightWing);

    const leftArm = new THREE.Mesh();
    leftArm.name = 'leftArm';
    group.add(leftArm);

    const rightArm = new THREE.Mesh();
    rightArm.name = 'rightArm';
    group.add(rightArm);

    const leftLeg = new THREE.Mesh();
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh();
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    const iterations = 100000;

    // Approach 1: getObjectByName (Current Implementation)
    const startGetObject = performance.now();
    for (let i = 0; i < iterations; i++) {
      const lw = group.getObjectByName('leftWing') as THREE.Mesh;
      const rw = group.getObjectByName('rightWing') as THREE.Mesh;
      const la = group.getObjectByName('leftArm') as THREE.Mesh;
      const ra = group.getObjectByName('rightArm') as THREE.Mesh;
      const ll = group.getObjectByName('leftLeg') as THREE.Mesh;
      const rl = group.getObjectByName('rightLeg') as THREE.Mesh;

      // Simulate some work
      if (lw && rw && la && ra && ll && rl) {
        lw.rotation.z = i;
      }
    }
    const durationGetObject = performance.now() - startGetObject;

    // Approach 2: Cached References (Proposed Implementation)
    // Caching them beforehand
    const refs = {
      lw: group.getObjectByName('leftWing') as THREE.Mesh,
      rw: group.getObjectByName('rightWing') as THREE.Mesh,
      la: group.getObjectByName('leftArm') as THREE.Mesh,
      ra: group.getObjectByName('rightArm') as THREE.Mesh,
      ll: group.getObjectByName('leftLeg') as THREE.Mesh,
      rl: group.getObjectByName('rightLeg') as THREE.Mesh,
    };

    const startRef = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { lw, rw, la, ra, ll, rl } = refs;

      // Simulate some work
      if (lw && rw && la && ra && ll && rl) {
        lw.rotation.z = i;
      }
    }
    const durationRef = performance.now() - startRef;

    console.log(`getObjectByName: ${durationGetObject.toFixed(2)}ms`);
    console.log(`Cached Ref: ${durationRef.toFixed(2)}ms`);
    console.log(`Speedup: ${(durationGetObject / durationRef).toFixed(2)}x`);

    expect(durationRef).toBeLessThan(durationGetObject);
  });
});
