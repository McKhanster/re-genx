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

    // Handle the categories that are actually being generated
    case 'color':
      return generateColorGeometry(mutation.traits, randomnessFactor, isMobile);
    case 'size':
      return generateSizeGeometry(mutation.traits, randomnessFactor, isMobile);
    case 'appendage':
      return generateTentaclesGeometry(mutation.traits, randomnessFactor, isMobile); // Reuse tentacles for appendages
    case 'pattern':
      return generatePatternGeometry(mutation.traits, randomnessFactor, isMobile);

    default:
      // Default to a simple sphere for unknown types
      console.warn(`Unknown mutation category: ${primaryTrait.category}, using default geometry`);
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

  // Create a single leg geometry (simplified for visibility)
  // Scale based on leg count and randomness
  const legRadius = 0.2 * (1 + randomnessFactor * 0.5);
  const legLength = 1.5 * Math.max(1, legCount / 4); // Longer legs for more legs
  const segments = isMobile ? 8 : 16;

  // Create one prominent leg as a cylinder
  const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius * 0.7, legLength, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0xff4444, // Red for legs
    emissive: 0x441111,
    emissiveIntensity: 0.3,
    shininess: 60,
  });

  return {
    geometry: legGeometry,
    material,
    position: new THREE.Vector3(0, -legLength / 2, 1.0), // Position below and in front of creature
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
 * Generate color mutation geometry
 */
function generateColorGeometry(
  traits: MutationTrait[],
  randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const segments = isMobile ? 16 : 32;
  const geometry = new THREE.SphereGeometry(0.2, segments, segments);

  // Get color from trait value and ensure it's a valid color
  const colorTrait = traits.find((t) => t.category === 'color');
  let color: string = '#ff0000'; // Default red
  
  if (colorTrait?.value && typeof colorTrait.value === 'string') {
    color = colorTrait.value;
  } else if (colorTrait?.value && typeof colorTrait.value === 'number') {
    color = `#${colorTrait.value.toString(16).padStart(6, '0')}`;
  }

  const material = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.8,
  });

  return {
    geometry,
    material,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 1.2 * randomnessFactor,
      (Math.random() - 0.5) * 1.2 * randomnessFactor,
      (Math.random() - 0.5) * 1.2 * randomnessFactor
    ),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(0, 0, 0),
  };
}

/**
 * Generate size mutation geometry
 */
function generateSizeGeometry(
  traits: MutationTrait[],
  randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const segments = isMobile ? 16 : 32;

  // Get size from trait value
  const sizeTrait = traits.find((t) => t.category === 'size');
  const sizeMultiplier = typeof sizeTrait?.value === 'number' ? sizeTrait.value : 1.2;

  const geometry = new THREE.SphereGeometry(0.15 * sizeMultiplier, segments, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0xffaa00, // Orange for size mutations
    emissive: 0x442200,
    emissiveIntensity: 0.3,
  });

  return {
    geometry,
    material,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 1.0 * randomnessFactor,
      (Math.random() - 0.5) * 1.0 * randomnessFactor,
      (Math.random() - 0.5) * 1.0 * randomnessFactor
    ),
    scale: new THREE.Vector3(sizeMultiplier, sizeMultiplier, sizeMultiplier),
    rotation: new THREE.Euler(0, 0, 0),
  };
}

/**
 * Generate appendage mutation geometry
 */
function generateAppendageGeometry(
  traits: MutationTrait[],
  randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const segments = isMobile ? 8 : 16;
  const geometry = new THREE.CylinderGeometry(0.05, 0.15, 0.8, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0xff4444, // Red for appendages
    emissive: 0x220000,
    emissiveIntensity: 0.2,
  });

  return {
    geometry,
    material,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 1.5 * randomnessFactor,
      0.2,
      (Math.random() - 0.5) * 1.5 * randomnessFactor
    ),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(
      Math.random() * 0.5,
      Math.random() * Math.PI * 2,
      Math.random() * 0.5
    ),
  };
}

/**
 * Generate pattern mutation geometry
 */
function generatePatternGeometry(
  traits: MutationTrait[],
  randomnessFactor: number,
  isMobile: boolean
): MutationGeometry {
  const segments = isMobile ? 12 : 24;
  const geometry = new THREE.OctahedronGeometry(0.25, 0);

  const material = new THREE.MeshPhongMaterial({
    color: 0x8844ff, // Purple for patterns
    emissive: 0x221144,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.7,
  });

  return {
    geometry,
    material,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 1.3 * randomnessFactor,
      (Math.random() - 0.5) * 1.3 * randomnessFactor,
      (Math.random() - 0.5) * 1.3 * randomnessFactor
    ),
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ),
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
  // Create visible default mutations
  const geometry = new THREE.SphereGeometry(0.3, segments, segments);

  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff88, // Bright green for visibility
    emissive: 0x004422,
    emissiveIntensity: 0.3,
    transparent: false,
    opacity: 1.0, // Make it fully opaque
  });

  return {
    geometry,
    material,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 1.5, // Closer to creature center
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    ),
    scale: new THREE.Vector3(1.0, 1.0, 1.0), // Normal size
    rotation: new THREE.Euler(0, 0, 0),
  };
}
