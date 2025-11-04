import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { SelectionManager } from "./SelectionManager";
import { TransformControlsManager } from "./TransformControlsManager";
import { SketchManager } from "./SketchManager";
import { ShapeFactory } from "./ShapeFactory";

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public orbitControls: OrbitControls;
  public selectionManager: SelectionManager;
  public transformControls: TransformControlsManager;
  public sketchManager: SketchManager;
  private animationId: number | null = null;
  private viewMode: "wireframe" | "default" | "realistic" = "default";
  private _wireframeOriginals: Map<string, THREE.Material | THREE.Material[]> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20);
    this.scene.add(gridHelper);

    // Axes
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;

    // Managers
    this.selectionManager = new SelectionManager(this.camera, this.scene);
    this.transformControls = new TransformControlsManager(
      this.camera,
      this.renderer,
      this.scene
    );
  this.sketchManager = new SketchManager(this.scene, this.camera, this.orbitControls);

    // Store orbit controls reference
    (this.renderer as any).orbitControls = this.orbitControls;
  }

  addShape(shape: THREE.Group): void {
    this.scene.add(shape);
  }

  removeShape(shape: THREE.Object3D): void {
    this.scene.remove(shape);
  }

  animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  };

  handleResize(): void {
    const canvas = this.renderer.domElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  /**
   * Change scene rendering mode.
   * - wireframe: enable wireframe on all meshes and show helpers
   * - default: normal rendering with helpers shown
   * - realistic: normal rendering with helpers (grid/axes) hidden
   */
  setViewMode(mode: "wireframe" | "default" | "realistic") {
    // If switching from wireframe to another mode, restore originals first
    if (this.viewMode === "wireframe" && mode !== "wireframe") {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const orig = this._wireframeOriginals.get(obj.uuid);
          if (orig) {
            obj.material = orig as any;
            this._wireframeOriginals.delete(obj.uuid);
          }
        }
      });
    }

    // If switching into wireframe, replace materials with a simple wireframe material
    if (mode === "wireframe") {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (!this._wireframeOriginals.has(obj.uuid)) {
            this._wireframeOriginals.set(obj.uuid, obj.material);
            try {
              const wf = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
              obj.material = wf as any;
            } catch (e) {
              // fallback: try toggling existing material's wireframe
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              mats.forEach((m: any) => {
                if (m && "wireframe" in m) m.wireframe = true;
                if (m && typeof m.needsUpdate !== "undefined") m.needsUpdate = true;
              });
            }
          }
        }
      });
    } else {
      // Not wireframe mode: ensure meshes are not in wireframe state
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            if (!m) return;
            if ("wireframe" in m) m.wireframe = false;
            if (mode === "realistic" && "flatShading" in m) {
              try {
                m.flatShading = false;
              } catch (e) {}
            }
            if (typeof m.needsUpdate !== "undefined") m.needsUpdate = true;
          });
        }
        // hide line segments (commonly used for edges) in realistic mode
        if (mode === "realistic" && obj instanceof THREE.LineSegments) {
          obj.visible = false;
        }
        // show line segments otherwise
        if (mode !== "realistic" && obj instanceof THREE.LineSegments) {
          obj.visible = true;
        }
        // toggle helpers (grid/axes) visibility for realistic mode
        if (obj instanceof THREE.GridHelper || obj instanceof THREE.AxesHelper) {
          obj.visible = mode !== "realistic";
        }
      });
    }

    this.viewMode = mode;
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.orbitControls.dispose();
    this.selectionManager.dispose();
    this.transformControls.dispose();
    this.sketchManager.dispose();
    this.renderer.dispose();
  }
}