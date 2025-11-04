import * as THREE from "three";
import { TransformControls } from "three-stdlib";
import { useSceneStore } from "../store/useSceneStore";

export class TransformControlsManager {
  private controls: TransformControls;
  private scene: THREE.Scene;

  constructor(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene
  ) {
    this.scene = scene;
    this.controls = new TransformControls(camera, renderer.domElement);
    this.scene.add(this.controls);

    this.controls.addEventListener("dragging-changed" as any, (event) => {
      // Disable camera controls when dragging
      const orbitControls = (renderer as any).orbitControls;
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }
    });
  }

  attachToObject(object: THREE.Object3D | null): void {
    this.controls.detach();
    console.debug("TransformControlsManager.attachToObject", object?.uuid, object);
    if (object) {
      this.controls.attach(object);
    }
  }

  setMode(mode: "translate" | "rotate" | "scale"): void {
    this.controls.setMode(mode);
  }

  dispose(): void {
    this.controls.dispose();
    this.scene.remove(this.controls);
  }
}