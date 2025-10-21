import * as THREE from 'three';
import { MutationData, MutationTrait } from '../../shared/types/api';

/**
 * Interface for mutation geometry configuration
 */
export interface MutationGeometry {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
}

/**
 * Generate geometry for different mutation types
 * @param mutation - Mutation data containing traits
 * @param randomnessFactor - Factor for applying randomness (0-1)
 * @param isMobile - Whether running on mobile device
 * @returns MutationGeometry configuration
 */
export function generateMutationGeometry(
  mutation: MutationData,
  randomnessFactor: number,
  isMobile: boolean = false
): MutationGeometry {
  // Find the primary trait that determines mutation type
  const primaryTrait = mutation.traits[0];

  if (!primaryTrait) {
    throw new Error('Mutation must have at least one trait');
  }

  // Generate geometry based on trait category
  switch (primaryTrait.category) {
    case 'legs':
      return generateLegsGeometry(mutation.traits, randomnessFactor, isMobile);
    case 'eyes':
      return generateEyesGeometry(mutation.traits, randomnessFactor, isMobile);
    case 'wings':
      return generateWingsGeometry(mutation.traits, randomnessFactor, isMobile);
    case 'spikes':
      return generateSpikesGeometry(mutation.traits, randomnessFactor, isMobile);
    case 'tentacles':
      return generateTentaclesGeometry(mutation.traits, randomnessFactor, isMobile);
    case 'horns':
      return generateHornsGeometry(mutation.traits, randomnessFactor, isMobile);
    default:
      // Default to a simple sphere for unknown types
      return generateDefaultGeometry(mutation.traits, randomnessFactor, isMobile);
  }
}

/**
 * Generate legs mutation geometry
 */
function generateLegsGeometry(
  traits: MutationTrait[],
  randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const legCountTrait = traits.find((t) => t.category === 'legs');
  const legCount = typeof legCountTrait?.value === 'number' ? legCountTrait.value : 4;

  // Create a group geometry for all legs
  const group = new THREE.Group();
  const legRadius = 0.15;
  const legLength = 1.2;
  const segments = isMobile ? 8 : 16;

  for (let i = 0; i < legCount; i++) {
    const angle = (i / legCount) * Math.PI * 2;
    const randomOffset = (Math.random() - 0.5) * 0.3 * randomnessFactor;

    // Create leg geometry
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius * 0.7, legLength, segments);

    const legMaterial = new THREE.MeshPhongMaterial({
      color: 0x00cc66,
      emissive: 0x00cc66,
      emissiveIntensity: 0.3,
    });

    const leg = new THREE.Mesh(legGeometry, legMaterial);

    // Position leg around the creature
    const distance = 1.2;
    leg.position.x = Math.cos(angle + randomOffset) * distance;
    leg.position.z = Math.sin(angle + randomOffset) * distance;
    leg.position.y = -legLength / 2;

    // Rotate leg outward
    leg.rotation.z = Math.cos(angle) * 0.3;
    leg.rotation.x = Math.sin(angle) * 0.3;

    group.add(leg);
  }

  // Convert group to single geometry (for performance)
  const mergedGeometry = new THREE.BufferGeometry();
  const material = new THREE.MeshPhongMaterial({
    color: 0x00cc66,
    emissive: 0x00cc66,
    emissiveIntensity: 0.3,
  });

  return {
    geometry: mergedGeometry,
    material,
    position: new THREE.Vector3(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(0, 0, 0),
  };
}

/**
 * Generate eyes mutation geometry
 */
function generateEyesGeometry(
  _traits: MutationTrait[],
  randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  // eyeCount could be used for multiple eyes in future enhancement
  // const eyeCountTrait = traits.find(t => t.category === 'eyes');
  // const eyeCount = eyeCountTrait?.value || 2;

  const segments = isMobile ? 16 : 32;
  const eyeRadius = 0.25;

  // Create sphere for eye
  const geometry = new THREE.SphereGeometry(eyeRadius, segments, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x4444ff,
    emissiveIntensity: 0.6,
    shininess: 100,
  });

  // Position on front of creature
  const angle = Math.random() * Math.PI * 2 * randomnessFactor;
  const height = 0.3 + Math.random() * 0.4 * randomnessFactor;

  return {
    geometry,
    material,
    position: new THREE.Vector3(Math.cos(angle) * 1.3, height, Math.sin(angle) * 1.3),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(0, 0, 0),
  };
}

/**
 * Generate wings mutation geometry
 */
function generateWingsGeometry(
  _traits: MutationTrait[],
  _randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const wingSpan = 2.5;
  const wingHeight = 1.5;

  // Create wing shape using plane geometry
  const geometry = new THREE.PlaneGeometry(
    wingSpan,
    wingHeight,
    isMobile ? 4 : 8,
    isMobile ? 4 : 8
  );

  // Deform to create wing curve
  const positionAttribute = geometry.getAttribute('position');
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);

    // Curve the wing
    const curve = Math.abs(x / wingSpan) * 0.5;
    positionAttribute.setZ(i, curve);
  }
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({
    color: 0x8844ff,
    emissive: 0x4422aa,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  return {
    geometry,
    material,
    position: new THREE.Vector3(-1.2, 0.5, 0),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(0, Math.PI / 4, 0),
  };
}

/**
 * Generate spikes mutation geometry
 */
function generateSpikesGeometry(
  _traits: MutationTrait[],
  _randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const spikeHeight = 0.8;
  const spikeRadius = 0.15;
  const segments = isMobile ? 6 : 12;

  const geometry = new THREE.ConeGeometry(spikeRadius, spikeHeight, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0xff4444,
    emissive: 0xaa2222,
    emissiveIntensity: 0.5,
  });

  // Random position on creature surface
  const angle = Math.random() * Math.PI * 2;
  const elevation = (Math.random() - 0.5) * Math.PI;
  const distance = 1.5;

  return {
    geometry,
    material,
    position: new THREE.Vector3(
      Math.cos(angle) * Math.cos(elevation) * distance,
      Math.sin(elevation) * distance,
      Math.sin(angle) * Math.cos(elevation) * distance
    ),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(elevation, angle, 0),
  };
}

/**
 * Generate tentacles mutation geometry
 */
function generateTentaclesGeometry(
  _traits: MutationTrait[],
  _randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const tentacleLength = 2.0;
  const tentacleRadius = 0.2;
  const segments = isMobile ? 8 : 16;

  // Create curved tentacle using cylinder
  const geometry = new THREE.CylinderGeometry(
    tentacleRadius,
    tentacleRadius * 0.5,
    tentacleLength,
    segments
  );

  // Curve the tentacle
  const positionAttribute = geometry.getAttribute('position');
  for (let i = 0; i < positionAttribute.count; i++) {
    const y = positionAttribute.getY(i);
    const normalizedY = (y + tentacleLength / 2) / tentacleLength;

    // Curve outward
    const curve = Math.sin(normalizedY * Math.PI) * 0.5;
    positionAttribute.setX(i, positionAttribute.getX(i) + curve);
  }
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({
    color: 0xff8844,
    emissive: 0xaa4422,
    emissiveIntensity: 0.4,
  });

  const angle = Math.random() * Math.PI * 2;

  return {
    geometry,
    material,
    position: new THREE.Vector3(Math.cos(angle) * 1.0, -0.5, Math.sin(angle) * 1.0),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(Math.PI / 4, angle, 0),
  };
}

/**
 * Generate horns mutation geometry
 */
function generateHornsGeometry(
  _traits: MutationTrait[],
  randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const hornHeight = 1.2;
  const hornRadius = 0.2;
  const segments = isMobile ? 8 : 16;

  const geometry = new THREE.ConeGeometry(hornRadius, hornHeight, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0xffaa44,
    emissive: 0xaa6622,
    emissiveIntensity: 0.5,
    shininess: 80,
  });

  // Position on top of creature
  const offsetX = (Math.random() - 0.5) * 0.6 * randomnessFactor;
  const offsetZ = (Math.random() - 0.5) * 0.6 * randomnessFactor;

  return {
    geometry,
    material,
    position: new THREE.Vector3(offsetX, 1.5, offsetZ),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(0, 0, 0),
  };
}

/**
 * Generate default geometry for unknown mutation types
 */
function generateDefaultGeometry(
  _traits: MutationTrait[],
  _randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const segments = isMobile ? 16 : 32;
  // Make default mutations much smaller and less visible
  const geometry = new THREE.SphereGeometry(0.1, segments, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    emissive: 0x555555,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.3, // Make it semi-transparent
  });

  return {
    geometry,
    material,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ),
    scale: new THREE.Vector3(0.5, 0.5, 0.5), // Make it smaller
    rotation: new THREE.Euler(0, 0, 0),
  };
}
