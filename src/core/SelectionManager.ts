import * as THREE from "three";
import { useSceneStore } from "../store/useSceneStore";

export class SelectionManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private highlightMaterial: THREE.MeshBasicMaterial;
  private originalMaterials: Map<string, THREE.Material | THREE.Material[]>;

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.scene = scene;
    this.highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
    });
    this.originalMaterials = new Map();
  }

  handleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const objects = this.scene.children.filter(
      (obj) => obj.userData.metadata
    );
    const intersects = this.raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      let targetObject = intersect.object;

      // Get the parent group if we hit a mesh
      while (targetObject.parent && !targetObject.userData.metadata) {
        targetObject = targetObject.parent;
      }

      this.selectObject(targetObject as THREE.Group);
    } else {
      this.clearSelection();
    }
  }

  selectObject(object: THREE.Object3D): void {
    console.debug("SelectionManager.selectObject ->", object?.uuid, object);
    this.clearSelection();

    const mesh = object.children.find(
      (child) => child instanceof THREE.Mesh
    ) as THREE.Mesh;
    if (mesh) {
      this.originalMaterials.set(object.uuid, mesh.material);
      mesh.material = this.highlightMaterial.clone();
    }

    useSceneStore.getState().setSelected({
      type: "shape",
      object: object,
    });
  }

  clearSelection(): void {
    const currentSelection = useSceneStore.getState().selected;
    if (currentSelection.object) {
      const mesh = currentSelection.object.children.find(
        (child) => child instanceof THREE.Mesh
      ) as THREE.Mesh;
      if (mesh) {
        const originalMaterial = this.originalMaterials.get(
          currentSelection.object.uuid
        );
        if (originalMaterial) {
          mesh.material = originalMaterial as THREE.Material;
          this.originalMaterials.delete(currentSelection.object.uuid);
        }
      }
    }

    useSceneStore.getState().setSelected({
      type: null,
      object: null,
    });
  }

  dispose(): void {
    this.originalMaterials.clear();
  }
}