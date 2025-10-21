/**
 * Simplex Noise implementation for organic fluid motion
 * Based on Stefan Gustavson's implementation
 */

// Permutation table
const p = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142,
  8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203,
  117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
  71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92,
  41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
  89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
  226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58,
  17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155,
  167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
  246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
  239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150,
  254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];

// Double the permutation table to avoid overflow
const perm = new Array(512);
for (let i = 0; i < 512; i++) {
  perm[i] = p[i & 255];
}

// Gradient vectors for 3D
const grad3 = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

/**
 * Fast floor function
 */
function fastFloor(x: number): number {
  return x > 0 ? Math.floor(x) : Math.floor(x) - 1;
}

/**
 * Dot product for 3D gradients
 */
function dot3(g: number[], x: number, y: number, z: number): number {
  return (g[0] ?? 0) * x + (g[1] ?? 0) * y + (g[2] ?? 0) * z;
}

/**
 * 3D Simplex Noise
 * Returns a value between -1 and 1
 */
export function noise3D(x: number, y: number, z: number): number {
  // Skewing and unskewing factors for 3D
  const F3 = 1.0 / 3.0;
  const G3 = 1.0 / 6.0;

  // Skew the input space to determine which simplex cell we're in
  const s = (x + y + z) * F3;
  const i = fastFloor(x + s);
  const j = fastFloor(y + s);
  const k = fastFloor(z + s);

  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;

  // Determine which simplex we are in
  let i1, j1, k1;
  let i2, j2, k2;

  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else if (x0 < z0) {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    }
  }

  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2.0 * G3;
  const y2 = y0 - j2 + 2.0 * G3;
  const z2 = z0 - k2 + 2.0 * G3;
  const x3 = x0 - 1.0 + 3.0 * G3;
  const y3 = y0 - 1.0 + 3.0 * G3;
  const z3 = z0 - 1.0 + 3.0 * G3;

  // Work out the hashed gradient indices
  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  const gi0 = (perm[ii + (perm[jj + (perm[kk] ?? 0)] ?? 0)] ?? 0) % 12;
  const gi1 = (perm[ii + i1 + (perm[jj + j1 + (perm[kk + k1] ?? 0)] ?? 0)] ?? 0) % 12;
  const gi2 = (perm[ii + i2 + (perm[jj + j2 + (perm[kk + k2] ?? 0)] ?? 0)] ?? 0) % 12;
  const gi3 = (perm[ii + 1 + (perm[jj + 1 + (perm[kk + 1] ?? 0)] ?? 0)] ?? 0) % 12;

  // Calculate the contribution from the four corners
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  let n0 = 0;
  if (t0 >= 0) {
    t0 *= t0;
    const g0 = grad3[gi0] ?? [0, 0, 0];
    n0 = t0 * t0 * dot3(g0, x0, y0, z0);
  }

  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  let n1 = 0;
  if (t1 >= 0) {
    t1 *= t1;
    const g1 = grad3[gi1] ?? [0, 0, 0];
    n1 = t1 * t1 * dot3(g1, x1, y1, z1);
  }

  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  let n2 = 0;
  if (t2 >= 0) {
    t2 *= t2;
    const g2 = grad3[gi2] ?? [0, 0, 0];
    n2 = t2 * t2 * dot3(g2, x2, y2, z2);
  }

  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  let n3 = 0;
  if (t3 >= 0) {
    t3 *= t3;
    const g3 = grad3[gi3] ?? [0, 0, 0];
    n3 = t3 * t3 * dot3(g3, x3, y3, z3);
  }

  // Add contributions from each corner and scale to [-1, 1]
  return 32.0 * (n0 + n1 + n2 + n3);
}

/**
 * Calculate radius offset for a vertex based on position and time
 * Creates smooth, organic fluid motion
 * @param x - X position of vertex
 * @param y - Y position of vertex
 * @param z - Z position of vertex
 * @param time - Current time in seconds
 * @param frequency - Frequency of the noise (higher = more detail)
 * @param amplitude - Amplitude of the offset (higher = more movement)
 * @returns Radius offset value (typically -amplitude to +amplitude)
 */
export function calculateRadiusOffset(
  x: number,
  y: number,
  z: number,
  time: number,
  frequency: number = 1.0,
  amplitude: number = 0.15
): number {
  // Use multiple octaves of noise for more organic movement
  const octave1 = noise3D(x * frequency, y * frequency, z * frequency + time * 0.3);
  const octave2 = noise3D(x * frequency * 2, y * frequency * 2, z * frequency * 2 + time * 0.5);
  const octave3 = noise3D(x * frequency * 4, y * frequency * 4, z * frequency * 4 + time * 0.7);

  // Combine octaves with decreasing amplitude
  const combined = octave1 * 0.5 + octave2 * 0.3 + octave3 * 0.2;

  // Apply smoothstep function to reduce extreme values (warts)
  const smoothed = combined * combined * (3 - 2 * combined);

  return smoothed * amplitude;
}

/**
 * Generate smooth pulsation value for overall creature scale
 * @param time - Current time in seconds
 * @param baseScale - Base scale value (default 1.0)
 * @param pulseAmount - Amount of pulsation (default 0.08)
 * @returns Scale multiplier
 */
export function generatePulsation(
  time: number,
  baseScale: number = 1.0,
  pulseAmount: number = 0.08
): number {
  // Use sine wave for smooth pulsation
  return baseScale + Math.sin(time * 2.0) * pulseAmount;
}
