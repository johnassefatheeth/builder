import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { ShapeFactory } from "./ShapeFactory";

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
  private currentTool: "rectangle" | "circle" | null = null;
  private hollow: boolean = false;

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

  enableSketchMode(tool: "rectangle" | "circle", hollow: boolean = false): void {
    this.currentTool = tool;
    this.hollow = hollow;
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

    if (this.currentTool === "rectangle") {
      const width = Math.abs(end.x - start.x);
      const depth = Math.abs(end.z - start.z);
      const geometry = new THREE.PlaneGeometry(width, depth);
      this.previewMesh = new THREE.Mesh(geometry, previewMaterial);
      this.previewMesh.rotation.x = -Math.PI / 2;
      this.previewMesh.position.set(
        (start.x + end.x) / 2,
        0.01,
        (start.z + end.z) / 2
      );
    } else if (this.currentTool === "circle") {
      const radius = start.distanceTo(end);
      const geometry = new THREE.CircleGeometry(radius, 32);
      this.previewMesh = new THREE.Mesh(geometry, previewMaterial);
      this.previewMesh.rotation.x = -Math.PI / 2;
      this.previewMesh.position.set(start.x, 0.01, start.z);
    }

    if (this.previewMesh) {
      this.scene.add(this.previewMesh);
    }
  }

  private createShape(start: THREE.Vector3, end: THREE.Vector3): THREE.Group {
    let shape: THREE.Shape;

    if (this.currentTool === "rectangle") {
      const width = Math.abs(end.x - start.x);
      const depth = Math.abs(end.z - start.z);
      shape = new THREE.Shape();
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
    } else {
      const radius = start.distanceTo(end);
      shape = new THREE.Shape();
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
      if (this.hollow) {
        const hole = new THREE.Path();
        hole.absarc(0, 0, Math.max(radius * 0.6, 0.01), 0, Math.PI * 2, false);
        shape.holes = [hole];
      }
    }

    // Thin extrude for 2D shapes so they are not thick 3D objects
    const thinDepth = 0.2;
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: thinDepth,
      bevelEnabled: false,
    };

    const extrudedShape = ShapeFactory.createExtrudedShape(shape, extrudeSettings);
    extrudedShape.position.set((start.x + end.x) / 2, thinDepth / 2, (start.z + end.z) / 2);
    extrudedShape.rotation.x = -Math.PI / 2;

    return extrudedShape;
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