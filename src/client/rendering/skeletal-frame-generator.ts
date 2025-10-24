import * as THREE from 'three';

/**
 * Generates a skeletal frame structure matching the cell pattern in orb.jpg
 * Creates glowing lines along cell boundaries for the inner structure
 */
export class SkeletalFrameGenerator {
  /**
   * Generate skeletal frame with glowing cell edges made of flexible tubes
   * @param radius - Radius of the sphere
   * @param cellCount - Number of cells (30-50 mobile, 80-100 desktop)
   * @returns Group containing tube meshes forming the skeletal structure
   */
  static generateSkeletalFrame(radius: number, cellCount: number): THREE.Group {
    // Generate evenly distributed points on sphere (Voronoi centers)
    const voronoiPoints = this.generateFibonacciSphere(cellCount, radius);

    // Create edges between nearby points to form cell boundaries
    const edges = this.generateCellEdges(voronoiPoints, radius);

    // Create group to hold all tubes
    const frameGroup = new THREE.Group();

    // Create glowing tube material
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ffff, // Cyan
      emissive: 0x00aaaa, // Cyan glow
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });

    // Create tubes for each edge
    const tubeRadius = 0.02; // Thin flexible tubes
    const radialSegments = 6; // Hexagonal tubes for performance

    for (const edge of edges) {
      const tube = this.createTubeBetweenPoints(edge.start, edge.end, tubeRadius, radialSegments);
      tube.material = material;
      frameGroup.add(tube);
    }

    return frameGroup;
  }

  /**
   * Create a tube (cylinder) between two points
   */
  private static createTubeBetweenPoints(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    radialSegments: number
  ): THREE.Mesh {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Create cylinder geometry
    const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments);

    // Create mesh
    const mesh = new THREE.Mesh(geometry);

    // Position at midpoint
    mesh.position.copy(midpoint);

    // Orient cylinder to point from start to end
    const axis = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(axis, direction.normalize());

    return mesh;
  }

  /**
   * Generate evenly distributed points on sphere using Fibonacci sphere algorithm
   */
  private static generateFibonacciSphere(count: number, radius: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      const x = radius * Math.sin(inclination) * Math.cos(azimuth);
      const y = radius * Math.sin(inclination) * Math.sin(azimuth);
      const z = radius * Math.cos(inclination);

      points.push(new THREE.Vector3(x, y, z));
    }

    return points;
  }

  /**
   * Generate edges between nearby points to form cell boundaries
   */
  private static generateCellEdges(
    points: THREE.Vector3[],
    radius: number
  ): Array<{ start: THREE.Vector3; end: THREE.Vector3 }> {
    const edges: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];
    const maxDistance = radius * 0.8; // Connect points within this distance

    // For each point, connect to nearby neighbors
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!point) continue;

      // Find nearest neighbors
      const neighbors = this.findNearestNeighbors(point, points, i, 6, maxDistance);

      // Create edges to neighbors
      for (const neighbor of neighbors) {
        // Avoid duplicate edges by only creating edge if i < neighbor index
        const neighborIndex = points.indexOf(neighbor);
        if (neighborIndex > i) {
          edges.push({ start: point, end: neighbor });
        }
      }
    }

    return edges;
  }

  /**
   * Find nearest neighbor points within max distance
   */
  private static findNearestNeighbors(
    center: THREE.Vector3,
    allPoints: THREE.Vector3[],
    centerIndex: number,
    maxNeighbors: number,
    maxDistance: number
  ): THREE.Vector3[] {
    const distances = allPoints
      .map((point, index) => ({
        point,
        distance: center.distanceTo(point),
        index,
      }))
      .filter((item) => item.index !== centerIndex && item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    return distances.slice(0, maxNeighbors).map((item) => item.point);
  }
}
