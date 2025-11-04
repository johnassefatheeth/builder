import * as THREE from "three";

export interface ShapeMetadata {
  type: "box" | "sphere" | "cylinder" | "extruded" | "cone" | "torus" | "plane";
  guid: string;
  parameters: any;
  faceCount: number;
  edgeCount: number;
}

export class ShapeFactory {
  static createBox(
    width = 1,
    height = 1,
    depth = 1
  ): THREE.Group & { metadata: ShapeMetadata } {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      metalness: 0.3,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Create edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);

    const group = new THREE.Group() as THREE.Group & {
      metadata: ShapeMetadata;
    };
    group.add(mesh);
    group.add(lineSegments);

    group.metadata = {
      type: "box",
      guid: THREE.MathUtils.generateUUID(),
      parameters: { width, height, depth },
      faceCount: 6,
      edgeCount: 12,
    };

  group.userData = { metadata: group.metadata };
    return group;
  }

  static createCone(
    radius = 0.5,
    height = 1,
    radialSegments = 32
  ): THREE.Group & { metadata: ShapeMetadata } {
    const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.3,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);

    const group = new THREE.Group() as THREE.Group & {
      metadata: ShapeMetadata;
    };
    group.add(mesh);
    group.add(lineSegments);

    group.metadata = {
      type: "cone",
      guid: THREE.MathUtils.generateUUID(),
      parameters: { radius, height, radialSegments },
      faceCount: radialSegments + 1,
      edgeCount: radialSegments * 3,
    };

    group.userData = { metadata: group.metadata };
    return group;
  }

  static createTorus(
    radius = 0.5,
    tube = 0.2,
    radialSegments = 16,
    tubularSegments = 100
  ): THREE.Group & { metadata: ShapeMetadata } {
    const geometry = new THREE.TorusGeometry(
      radius,
      tube,
      radialSegments,
      tubularSegments
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x8e44ad,
      metalness: 0.3,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);

    const group = new THREE.Group() as THREE.Group & {
      metadata: ShapeMetadata;
    };
    group.add(mesh);
    group.add(lineSegments);

    group.metadata = {
      type: "torus",
      guid: THREE.MathUtils.generateUUID(),
      parameters: { radius, tube, radialSegments, tubularSegments },
      faceCount: radialSegments * tubularSegments,
      edgeCount: radialSegments * tubularSegments,
    };

    group.userData = { metadata: group.metadata };
    return group;
  }

  static createPlane(width = 1, height = 1): THREE.Group & { metadata: ShapeMetadata } {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({
      color: 0x95a5a6,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const group = new THREE.Group() as THREE.Group & {
      metadata: ShapeMetadata;
    };
    group.add(mesh);

    group.metadata = {
      type: "plane",
      guid: THREE.MathUtils.generateUUID(),
      parameters: { width, height },
      faceCount: 2,
      edgeCount: 4,
    };

    group.userData = { metadata: group.metadata };
    return group;
  }

  static createSphere(
    radius = 0.5,
    widthSegments = 32,
    heightSegments = 16
  ): THREE.Group & { metadata: ShapeMetadata } {
    const geometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      metalness: 0.3,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);

    const group = new THREE.Group() as THREE.Group & {
      metadata: ShapeMetadata;
    };
    group.add(mesh);
    group.add(lineSegments);

    group.metadata = {
      type: "sphere",
      guid: THREE.MathUtils.generateUUID(),
      parameters: { radius, widthSegments, heightSegments },
      faceCount: widthSegments * heightSegments,
      edgeCount: widthSegments * heightSegments * 2,
    };

  group.userData = { metadata: group.metadata };
    return group;
  }

  static createCylinder(
    radiusTop = 0.5,
    radiusBottom = 0.5,
    height = 1,
    radialSegments = 32
  ): THREE.Group & { metadata: ShapeMetadata } {
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      metalness: 0.3,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);

    const group = new THREE.Group() as THREE.Group & {
      metadata: ShapeMetadata;
    };
    group.add(mesh);
    group.add(lineSegments);

    group.metadata = {
      type: "cylinder",
      guid: THREE.MathUtils.generateUUID(),
      parameters: { radiusTop, radiusBottom, height, radialSegments },
      faceCount: radialSegments + 2,
      edgeCount: radialSegments * 3,
    };

  group.userData = { metadata: group.metadata };
    return group;
  }

  static createExtrudedShape(
    shape: THREE.Shape,
    extrudeSettings: THREE.ExtrudeGeometryOptions
  ): THREE.Group & { metadata: ShapeMetadata } {
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      metalness: 0.3,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);

    const group = new THREE.Group() as THREE.Group & {
      metadata: ShapeMetadata;
    };
    group.add(mesh);
    group.add(lineSegments);

    group.metadata = {
      type: "extruded",
      guid: THREE.MathUtils.generateUUID(),
      parameters: { shape, extrudeSettings },
      faceCount: geometry.attributes.position.count / 3,
      edgeCount: 0, 
    };

  group.userData = { metadata: group.metadata };
    return group;
  }
}