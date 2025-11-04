import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
// ShapeFactory not required for flat 2D sketch shapes

export class SketchManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private orbitControls?: OrbitControls;
  private sketchPlane: THREE.Mesh;
  private gridHelper: THREE.GridHelper;
  private isDrawing: boolean = false;
  private startPoint: THREE.Vector3 | null = null;
  private previewMesh: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private snapToGrid: boolean = true;
  private gridSize: number = 0.5;
  private currentTool: "rectangle" | "circle" | "triangle" | "ellipse" | "polygon" | null = null;
  private hollow: boolean = false;
  private polygonSides: number = 5;
  private extrudeEnabled: boolean = false;
  private extrudeDepth: number = 0.2;

  constructor(scene: THREE.Scene, camera: THREE.Camera, orbitControls?: OrbitControls) {
    this.scene = scene;
    this.camera = camera;
    this.orbitControls = orbitControls;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Create sketch plane
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.sketchPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.sketchPlane.rotation.x = -Math.PI / 2;
    this.sketchPlane.visible = false;

    // Grid helper (divisions based on gridSize)
    const divisions = Math.max(10, Math.round(100 / this.gridSize));
    this.gridHelper = new THREE.GridHelper(100, divisions, 0x444444, 0x888888);
    this.gridHelper.visible = false;
  }

  enableSketchMode(
    tool: "rectangle" | "circle" | "triangle" | "ellipse" | "polygon",
    hollow: boolean = false,
    polygonSides?: number
  ): void {
    this.currentTool = tool;
    this.hollow = hollow;
    if (polygonSides && polygonSides >= 3) this.polygonSides = Math.floor(polygonSides);
    this.sketchPlane.visible = true;
    this.gridHelper.visible = true;
    this.scene.add(this.sketchPlane);
    this.scene.add(this.gridHelper);
    // Disable orbit controls while sketching so the scene doesn't move
    if (this.orbitControls) {
      this.orbitControls.enabled = false;
    }
  }

  disableSketchMode(): void {
    this.currentTool = null;
    this.sketchPlane.visible = false;
    this.gridHelper.visible = false;
    this.clearPreview();
    // Re-enable orbit controls when leaving sketch mode
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
    }
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.currentTool) return;

    const point = this.getIntersectionPoint(event, canvas);
    if (point) {
      this.isDrawing = true;
      this.startPoint = point;
    }
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDrawing || !this.startPoint || !this.currentTool) return;

    const point = this.getIntersectionPoint(event, canvas);
    if (point) {
      this.updatePreview(this.startPoint, point);
    }
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): THREE.Group | null {
    if (!this.isDrawing || !this.startPoint || !this.currentTool) return null;

    const point = this.getIntersectionPoint(event, canvas);
    if (point) {
      const shape = this.createShape(this.startPoint, point);
      console.debug("SketchManager.handleMouseUp -> created shape", shape?.uuid, shape, "tool:", this.currentTool, "hollow:", this.hollow);
      this.isDrawing = false;
      this.startPoint = null;
      this.clearPreview();
      return shape;
    }

    this.isDrawing = false;
    this.startPoint = null;
    this.clearPreview();
    return null;
  }

  private getIntersectionPoint(
    event: MouseEvent,
    canvas: HTMLCanvasElement
  ): THREE.Vector3 | null {
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.sketchPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point.clone();
      if (this.snapToGrid) {
        point.x = Math.round(point.x / this.gridSize) * this.gridSize;
        point.z = Math.round(point.z / this.gridSize) * this.gridSize;
      }
      return point;
    }
    return null;
  }

  private updatePreview(start: THREE.Vector3, end: THREE.Vector3): void {
    this.clearPreview();

    const previewMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    // Use the same shape-building logic as creation so preview matches final output
    if (this.currentTool) {
      // If hollow, build an outline preview (LineLoop), otherwise filled shape
      if (this.hollow) {
        const pts2 = this.buildOutlinePoints(start, end);
        if (pts2.length > 0) {
          const pts3 = pts2.map((p) => new THREE.Vector3(p.x, p.y, 0));
          const geom = new THREE.BufferGeometry().setFromPoints(pts3);
          const mat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
          this.previewMesh = new THREE.LineLoop(geom, mat) as any;
          if (this.previewMesh) {
            this.previewMesh.rotation.x = -Math.PI / 2;
            if (this.currentTool === "rectangle") {
              this.previewMesh.position.set((start.x + end.x) / 2, 0.01, (start.z + end.z) / 2);
            } else {
              this.previewMesh.position.set(start.x, 0.01, start.z);
            }
          }
        }
      } else {
        const shape = this.buildShape(start, end);
        if (shape) {
          const geometry = new THREE.ShapeGeometry(shape);
          this.previewMesh = new THREE.Mesh(geometry, previewMaterial);
          if (this.previewMesh) {
            this.previewMesh.rotation.x = -Math.PI / 2;
            // position similarly to final placement
            if (this.currentTool === "rectangle") {
              this.previewMesh.position.set((start.x + end.x) / 2, 0.01, (start.z + end.z) / 2);
            } else {
              this.previewMesh.position.set(start.x, 0.01, start.z);
            }
          }
        }
      }
    }

    if (this.previewMesh) {
      this.scene.add(this.previewMesh);
    }
  }

  private createShape(start: THREE.Vector3, end: THREE.Vector3): THREE.Group {
    const shape = this.buildShape(start, end);
    if (!shape) return new THREE.Group();

    const group = new THREE.Group();

    if (this.hollow) {
      // Build outline points in XY plane and create a LineLoop
      const pts2 = this.buildOutlinePoints(start, end);
      const pts3 = pts2.map((p) => new THREE.Vector3(p.x, p.y, 0));
      const geom = new THREE.BufferGeometry().setFromPoints(pts3);
      const mat = new THREE.LineBasicMaterial({ color: 0x873217 });
      const line = new THREE.LineLoop(geom, mat);
      line.rotation.x = -Math.PI / 2;
      if (this.currentTool === "rectangle") {
        line.position.set((start.x + end.x) / 2, 0.01, (start.z + end.z) / 2);
      } else {
        line.position.set(start.x, 0.01, start.z);
      }
      group.add(line);
      // store a shape representation so this outline can be extruded later
      try {
        group.userData = group.userData || {};
        group.userData.shape2D = shape;
      } catch (e) {
        // ignore
      }
    } else {
      // Create extruded mesh if enabled, otherwise flat mesh
      if (this.extrudeEnabled && this.extrudeDepth > 0) {
        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          depth: this.extrudeDepth,
          bevelEnabled: false,
        };
        const geometryExtrude = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const materialExtrude = new THREE.MeshStandardMaterial({ color: 0x873217 });
        const mesh = new THREE.Mesh(geometryExtrude, materialExtrude);
        // Rotate so extrusion becomes vertical (Y) and lift half depth
        mesh.rotation.x = -Math.PI / 2;
        if (this.currentTool === "rectangle") {
          mesh.position.set((start.x + end.x) / 2, this.extrudeDepth / 2, (start.z + end.z) / 2);
        } else {
          mesh.position.set(start.x, this.extrudeDepth / 2, start.z);
        }
        group.add(mesh);
      } else {
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshStandardMaterial({
          color: 0x873217,
          side: THREE.DoubleSide,
        });
  const mesh = new THREE.Mesh(geometry, material);
        // Lay flat on XZ plane (shape is created in XY plane)
        mesh.rotation.x = -Math.PI / 2;

        // Position the mesh to match the preview behavior
        if (this.currentTool === "rectangle") {
          mesh.position.set((start.x + end.x) / 2, 0.01, (start.z + end.z) / 2);
        } else {
          // circle: center at start
          mesh.position.set(start.x, 0.01, start.z);
        }

        group.add(mesh);
        // store the underlying shape so we can extrude later
        try {
          group.userData = group.userData || {};
          group.userData.shape2D = shape;
        } catch (e) {
          // noop
        }
      }
    }

    // mark group so SelectionManager can find it
    group.userData = group.userData || {};
    group.userData.metadata = { tool: this.currentTool };
    // also store extrude state for convenience
    group.userData.extruded = this.extrudeEnabled && !!this.extrudeDepth;
    group.userData.extrudeDepth = this.extrudeDepth;
    return group;
  }

  /**
   * Extrude an already-created sketch group (or a uuid that resolves to a group) in-place.
   * Returns the created Mesh or null on failure.
   */
  public extrudeExisting(groupOrUuid: THREE.Group | string, depth?: number): THREE.Mesh | null {
    let group: THREE.Group | null = null;
    if (typeof groupOrUuid === "string") {
      const obj = this.scene.getObjectByProperty("uuid", groupOrUuid) as THREE.Object3D | undefined;
      if (!obj) return null;
      // if uuid points to a child mesh, take its parent as the group
      if ((obj as any).isGroup) group = obj as THREE.Group;
      else if (obj.parent && (obj.parent as any).isGroup) group = obj.parent as THREE.Group;
      else return null;
    } else {
      group = groupOrUuid;
    }

    if (!group) return null;

    // obtain a shape from stored userData if available
    let shape: THREE.Shape | undefined = group.userData?.shape2D as THREE.Shape | undefined;

    // fallback: try to extract from existing mesh geometry parameters
    if (!shape) {
      const meshChild = group.children.find((c) => (c as any).isMesh) as THREE.Mesh | undefined;
      if (meshChild) {
        const geom: any = (meshChild.geometry as any) || {};
        // ShapeGeometry often stores the original shapes under parameters.shapes
        if (geom.parameters && geom.parameters.shapes) {
          shape = geom.parameters.shapes as THREE.Shape;
        }
      }
    }

    if (!shape) return null;

    const d = typeof depth === "number" ? Math.max(0, depth) : Math.max(0, group.userData?.extrudeDepth ?? this.extrudeDepth);

    // dispose previous children resources
    for (const child of [...group.children]) {
      // dispose geometries/materials when applicable
      const meshc = child as any;
      if (meshc.geometry) {
        try {
          meshc.geometry.dispose();
        } catch (e) {
          // ignore
        }
      }
      if (meshc.material) {
        try {
          if (Array.isArray(meshc.material)) meshc.material.forEach((m: any) => m.dispose && m.dispose());
          else meshc.material.dispose && meshc.material.dispose();
        } catch (e) {
          // ignore
        }
      }
      group.remove(child);
    }

    // create extruded geometry from stored shape
    const extrudeSettings: THREE.ExtrudeGeometryOptions = { depth: d, bevelEnabled: false };
    const geometryExtrude = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const materialExtrude = new THREE.MeshStandardMaterial({ color: 0x873217 });
    const mesh = new THREE.Mesh(geometryExtrude, materialExtrude);
    mesh.rotation.x = -Math.PI / 2;

    // place at same XZ as previous child if available, otherwise at origin
    const prevPos = (group.userData?.lastChildPosition as any) as { x?: number; z?: number } | undefined;
    if (prevPos && typeof prevPos.x === "number" && typeof prevPos.z === "number") {
      mesh.position.set(prevPos.x, d / 2, prevPos.z);
    } else if (group.position) {
      mesh.position.set(group.position.x, d / 2, group.position.z);
    } else {
      mesh.position.set(0, d / 2, 0);
    }

    group.add(mesh);
    group.userData.extruded = true;
    group.userData.extrudeDepth = d;
    group.userData.shape2D = shape;
    return mesh;
  }

  /** Build outline points in XY plane for hollow shapes */
  private buildOutlinePoints(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector2[] {
    if (!this.currentTool) return [];
    const pts: THREE.Vector2[] = [];
    if (this.currentTool === "rectangle") {
      const w = Math.abs(end.x - start.x);
      const d = Math.abs(end.z - start.z);
      pts.push(new THREE.Vector2(-w / 2, -d / 2));
      pts.push(new THREE.Vector2(w / 2, -d / 2));
      pts.push(new THREE.Vector2(w / 2, d / 2));
      pts.push(new THREE.Vector2(-w / 2, d / 2));
      return pts;
    }
    if (this.currentTool === "circle") {
      const r = start.distanceTo(end);
      const segments = 64;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
      }
      return pts;
    }
    if (this.currentTool === "triangle") {
      const w = Math.abs(end.x - start.x);
      const d = Math.abs(end.z - start.z);
      pts.push(new THREE.Vector2(0, d / 2));
      pts.push(new THREE.Vector2(w / 2, -d / 2));
      pts.push(new THREE.Vector2(-w / 2, -d / 2));
      return pts;
    }
    if (this.currentTool === "ellipse") {
      const rx = Math.abs(end.x - start.x);
      const ry = Math.abs(end.z - start.z);
      const segments = 64;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector2(Math.cos(a) * rx, Math.sin(a) * ry));
      }
      return pts;
    }
    if (this.currentTool === "polygon") {
      const sides = Math.max(3, Math.floor(this.polygonSides || 5));
      const r = start.distanceTo(end);
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
      }
      return pts;
    }
    return pts;
  }

  /**
   * Build a THREE.Shape for the active tool given start/end points (world XZ plane coordinates).
   */
  private buildShape(start: THREE.Vector3, end: THREE.Vector3): THREE.Shape | null {
    if (!this.currentTool) return null;

    if (this.currentTool === "rectangle") {
      const width = Math.abs(end.x - start.x);
      const depth = Math.abs(end.z - start.z);
      const shape = new THREE.Shape();
      shape.moveTo(-width / 2, -depth / 2);
      shape.lineTo(width / 2, -depth / 2);
      shape.lineTo(width / 2, depth / 2);
      shape.lineTo(-width / 2, depth / 2);
      shape.lineTo(-width / 2, -depth / 2);

      if (this.hollow) {
        const insetX = Math.max(width * 0.08, 0.01);
        const insetZ = Math.max(depth * 0.08, 0.01);
        const hole = new THREE.Path();
        hole.moveTo(-width / 2 + insetX, -depth / 2 + insetZ);
        hole.lineTo(width / 2 - insetX, -depth / 2 + insetZ);
        hole.lineTo(width / 2 - insetX, depth / 2 - insetZ);
        hole.lineTo(-width / 2 + insetX, depth / 2 - insetZ);
        hole.lineTo(-width / 2 + insetX, -depth / 2 + insetZ);
        shape.holes = [hole];
      }
      return shape;
    }

    if (this.currentTool === "circle") {
      const radius = start.distanceTo(end);
      const shape = new THREE.Shape();
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
      if (this.hollow) {
        const hole = new THREE.Path();
        hole.absarc(0, 0, Math.max(radius * 0.6, 0.01), 0, Math.PI * 2, false);
        shape.holes = [hole];
      }
      return shape;
    }

    if (this.currentTool === "triangle") {
      const width = Math.abs(end.x - start.x);
      const depth = Math.abs(end.z - start.z);
      const shape = new THREE.Shape();
      // isosceles triangle centered at origin
      shape.moveTo(0, depth / 2);
      shape.lineTo(width / 2, -depth / 2);
      shape.lineTo(-width / 2, -depth / 2);
      shape.lineTo(0, depth / 2);
      if (this.hollow) {
        const factor = 0.6;
        const hole = new THREE.Path();
        hole.moveTo(0, (depth / 2) * factor);
        hole.lineTo((width / 2) * factor, (-depth / 2) * factor);
        hole.lineTo((-width / 2) * factor, (-depth / 2) * factor);
        hole.lineTo(0, (depth / 2) * factor);
        shape.holes = [hole];
      }
      return shape;
    }

    if (this.currentTool === "ellipse") {
      const rx = Math.abs(end.x - start.x);
      const ry = Math.abs(end.z - start.z);
      // use EllipseCurve to sample points and create a shape
      const curve = new (THREE as any).EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
      const pts = curve.getPoints(64).map((p: any) => new THREE.Vector2(p.x, p.y));
      const shape = new THREE.Shape(pts);
      if (this.hollow) {
        const innerCurve = new (THREE as any).EllipseCurve(0, 0, Math.max(rx * 0.6, 0.01), Math.max(ry * 0.6, 0.01), 0, Math.PI * 2, false, 0);
        const innerPts = innerCurve.getPoints(64).map((p: any) => new THREE.Vector2(p.x, p.y));
        shape.holes = [new THREE.Path(innerPts)];
      }
      return shape;
    }

    if (this.currentTool === "polygon") {
      const sides = Math.max(3, Math.floor(this.polygonSides || 5));
      const radius = start.distanceTo(end);
      const shape = new THREE.Shape();
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      if (this.hollow) {
        const inner = new THREE.Path();
        const innerR = Math.max(radius * 0.5, 0.01);
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2;
          const x = Math.cos(a) * innerR;
          const y = Math.sin(a) * innerR;
          if (i === 0) inner.moveTo(x, y);
          else inner.lineTo(x, y);
        }
        inner.closePath();
        shape.holes = [inner];
      }
      return shape;
    }

    return null;
  }

  // Public API to control grid snapping
  setSnapToGrid(enabled: boolean) {
    this.snapToGrid = enabled;
  }

  setGridSize(size: number) {
    this.gridSize = Math.max(0.01, size);
    const divisions = Math.max(10, Math.round(100 / this.gridSize));
    // recreate helper to update divisions
    this.scene.remove(this.gridHelper);
    this.gridHelper = new THREE.GridHelper(100, divisions, 0x444444, 0x888888);
    this.gridHelper.visible = !!this.currentTool;
    this.scene.add(this.gridHelper);
  }

  setHollow(h: boolean) {
    this.hollow = h;
  }

  setExtrude(enabled: boolean) {
    this.extrudeEnabled = enabled;
  }

  setExtrudeDepth(depth: number) {
    this.extrudeDepth = Math.max(0, depth);
  }

  private clearPreview(): void {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      (this.previewMesh.material as THREE.Material).dispose();
      this.previewMesh = null;
    }
  }

  dispose(): void {
    this.scene.remove(this.sketchPlane);
    this.scene.remove(this.gridHelper);
    this.clearPreview();
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
    }
  }
}