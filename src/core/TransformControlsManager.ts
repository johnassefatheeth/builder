import * as THREE from "three";
import { TransformControls } from "three-stdlib";
import { useSceneStore } from "../store/useSceneStore";

export class TransformControlsManager {
  private controls: TransformControls;
  private scene: THREE.Scene;
  private attachedObject: THREE.Object3D | null = null;
  private _startTransform:
    | {
        position: [number, number, number];
        quaternion: [number, number, number, number];
        scale: [number, number, number];
        uuid: string;
      }
    | null = null;

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

      // When dragging starts, capture the starting transform of the attached object
      if (event.value) {
        const obj = this.attachedObject;
        if (obj) {
          this._startTransform = {
            uuid: obj.uuid,
            position: [obj.position.x, obj.position.y, obj.position.z],
            quaternion: [obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z],
          };
        } else {
          this._startTransform = null;
        }
      }

      // When dragging ends, capture the final transform and record change
      if (!event.value) {
        const obj = this.attachedObject;
        if (obj && this._startTransform && this._startTransform.uuid === obj.uuid) {
          const after = {
            position: [obj.position.x, obj.position.y, obj.position.z] as [number, number, number],
            quaternion: [obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w] as [number, number, number, number],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z] as [number, number, number],
          };
          // record via the store
          try {
            (useSceneStore as any).getState().recordTransform(
              obj.uuid,
              this._startTransform as any,
              after as any
            );
          } catch (e) {
            // safe no-op if store method not available
          }
        }
        this._startTransform = null;
      }
    });
  }

  attachToObject(object: THREE.Object3D | null): void {
    this.controls.detach();
    console.debug("TransformControlsManager.attachToObject", object?.uuid, object);
    this.attachedObject = object;
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