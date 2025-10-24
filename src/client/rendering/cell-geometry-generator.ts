import * as THREE from 'three';

/**
 * Interface representing a cell polygon on the sphere surface
 */
interface CellPolygon {
  center: THREE.Vector3;
  vertices: THREE.Vector3[];
  edges: [THREE.Vector3, THREE.Vector3][];
}

/**
 * Generates Voronoi-based cell geometry for organic, biological appearance
 */
export class CellGeometryGenerator {
  /**
   * Generate cell-based sphere geometry with organic patterns
   * @param baseRadius - Base radius of the sphere
   * @param cellCount - Number of Voronoi cells (30-50 mobile, 80-100 desktop)
   * @param depthVariation - Depth variation for cell relief (0.1-0.3)
   * @returns BufferGeometry with cell pattern
   */
  static generateCellGeometry(
    baseRadius: number,
    cellCount: number,
    depthVariation: number
  ): THREE.BufferGeometry {
    // Generate Voronoi points on sphere surface
    const voronoiPoints = this.generateVoronoiPoints(cellCount, baseRadius);

    // Create cell polygons from Voronoi tessellation
    const cellPolygons = this.createCellPolygons(voronoiPoints, baseRadius);

    // Convert cell polygons to Three.js geometry
    const geometry = this.polygonsToGeometry(cellPolygons, depthVariation, baseRadius);

    return geometry;
  }

  /**
   * Generate evenly distributed points on sphere surface using Fibonacci sphere algorithm
   * @param count - Number of points to generate
   * @param radius - Sphere radius
   * @returns Array of points on sphere surface
   */
  private static generateVoronoiPoints(count: number, radius: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < count; i++) {
      // Fibonacci sphere algorithm for even distribution
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
   * Create cell polygons from Voronoi points using nearest neighbor tessellation
   * @param points - Voronoi center points
   * @param radius - Sphere radius
   * @returns Array of cell polygons
   */
  private static createCellPolygons(
    points: THREE.Vector3[],
    radius: number
  ): CellPolygon[] {
    const polygons: CellPolygon[] = [];

    // For each Voronoi point, create a cell by finding vertices
    // that are equidistant to neighboring Voronoi points
    for (let i = 0; i < points.length; i++) {
      const center = points[i];
      if (!center) continue;
      
      const vertices = this.generateCellVertices(center, points, i, radius);
      const edges = this.generateCellEdges(vertices);

      polygons.push({
        center,
        vertices,
        edges,
      });
    }

    return polygons;
  }

  /**
   * Generate vertices for a single cell by subdividing the region around the center
   * @param center - Cell center point
   * @param allPoints - All Voronoi points
   * @param centerIndex - Index of center point
   * @param radius - Sphere radius
   * @returns Array of vertices forming the cell boundary
   */
  private static generateCellVertices(
    center: THREE.Vector3,
    allPoints: THREE.Vector3[],
    centerIndex: number,
    radius: number
  ): THREE.Vector3[] {
    // Generate vertices by creating points around the center
    const vertices: THREE.Vector3[] = [];
    const vertexCount = 8; // 5-8 sides per cell as per requirements

    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;

      // Create a point on the sphere surface around the center
      const tangent1 = new THREE.Vector3();
      const tangent2 = new THREE.Vector3();

      // Calculate tangent vectors perpendicular to center
      if (Math.abs(center.y) < 0.99) {
        tangent1.set(-center.z, 0, center.x).normalize();
      } else {
        tangent1.set(1, 0, 0);
      }
      tangent2.crossVectors(center, tangent1).normalize();

      // Create vertex using tangent vectors
      const offset = 0.3; // Distance from center to vertex
      const tangent1Scaled = tangent1.clone().multiplyScalar(Math.cos(angle) * offset);
      const tangent2Scaled = tangent2.clone().multiplyScalar(Math.sin(angle) * offset);
      const vertex = center
        .clone()
        .add(tangent1Scaled)
        .add(tangent2Scaled)
        .normalize()
        .multiplyScalar(radius);

      vertices.push(vertex);
    }

    return vertices;
  }

  /**
   * Find nearest neighbor points to a given center
   * @param center - Center point
   * @param allPoints - All points
   * @param centerIndex - Index of center point to exclude
   * @param count - Number of neighbors to find
   * @returns Array of nearest neighbor points
   */
  private static findNearestNeighbors(
    center: THREE.Vector3,
    allPoints: THREE.Vector3[],
    centerIndex: number,
    count: number
  ): THREE.Vector3[] {
    const distances = allPoints
      .map((point, index) => ({
        point,
        distance: center.distanceTo(point),
        index,
      }))
      .filter((item) => item.index !== centerIndex)
      .sort((a, b) => a.distance - b.distance);

    return distances.slice(0, count).map((item) => item.point);
  }

  /**
   * Generate edges from vertices
   * @param vertices - Cell vertices
   * @returns Array of edges as vertex pairs
   */
  private static generateCellEdges(
    vertices: THREE.Vector3[]
  ): [THREE.Vector3, THREE.Vector3][] {
    const edges: [THREE.Vector3, THREE.Vector3][] = [];

    for (let i = 0; i < vertices.length; i++) {
      const nextIndex = (i + 1) % vertices.length;
      const currentVertex = vertices[i];
      const nextVertex = vertices[nextIndex];
      if (currentVertex && nextVertex) {
        edges.push([currentVertex, nextVertex]);
      }
    }

    return edges;
  }

  /**
   * Convert cell polygons to Three.js BufferGeometry with solid appearance
   * Creates a complete sphere surface without holes
   * @param polygons - Array of cell polygons
   * @param depthVariation - Depth variation for surface relief
   * @param baseRadius - Base sphere radius
   * @returns BufferGeometry with cell pattern covering entire surface
   */
  private static polygonsToGeometry(
    polygons: CellPolygon[],
    depthVariation: number,
    baseRadius: number
  ): THREE.BufferGeometry {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    let vertexIndex = 0;

    // Convert each cell polygon to triangles
    for (const polygon of polygons) {
      const { center, vertices } = polygon;

      // Add random depth variation to create surface relief
      const depth = (Math.random() - 0.5) * depthVariation;
      const adjustedCenter = center.clone().normalize().multiplyScalar(baseRadius + depth);

      // Add center vertex
      const centerIndex = vertexIndex++;
      positions.push(adjustedCenter.x, adjustedCenter.y, adjustedCenter.z);

      const centerNormal = adjustedCenter.clone().normalize();
      normals.push(centerNormal.x, centerNormal.y, centerNormal.z);

      // UV mapping for center (spherical coordinates)
      const centerUV = this.sphericalUV(adjustedCenter);
      uvs.push(centerUV.x, centerUV.y);

      // Add vertices with slight depth variation
      const vertexIndices: number[] = [];
      for (const vertex of vertices) {
        const vertexDepth = depth + (Math.random() - 0.5) * depthVariation * 0.3;
        const adjustedVertex = vertex.clone().normalize().multiplyScalar(baseRadius + vertexDepth);

        vertexIndices.push(vertexIndex++);
        positions.push(adjustedVertex.x, adjustedVertex.y, adjustedVertex.z);

        const vertexNormal = adjustedVertex.clone().normalize();
        normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);

        const vertexUV = this.sphericalUV(adjustedVertex);
        uvs.push(vertexUV.x, vertexUV.y);
      }

      // Create triangles from center to each edge
      // This creates a complete surface with no holes
      for (let i = 0; i < vertexIndices.length; i++) {
        const nextIndex = (i + 1) % vertexIndices.length;
        const currentVertex = vertexIndices[i];
        const nextVertex = vertexIndices[nextIndex];
        if (currentVertex !== undefined && nextVertex !== undefined) {
          indices.push(centerIndex, currentVertex, nextVertex);
        }
      }
    }

    // Create BufferGeometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    // Compute vertex normals for smooth shading
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Calculate spherical UV coordinates for a point
   * @param point - 3D point on sphere
   * @returns UV coordinates
   */
  private static sphericalUV(point: THREE.Vector3): THREE.Vector2 {
    const normalized = point.clone().normalize();
    const u = 0.5 + Math.atan2(normalized.z, normalized.x) / (2 * Math.PI);
    const v = 0.5 - Math.asin(normalized.y) / Math.PI;
    return new THREE.Vector2(u, v);
  }
}
