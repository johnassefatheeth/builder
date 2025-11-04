import * as THREE from "three";
import type { ShapeMetadata } from "../core/ShapeFactory";

export interface SceneData {
  version: string;
  objects: SerializedObject[];
}

export interface SerializedObject {
  metadata: ShapeMetadata;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export class SceneExporter {
  static exportScene(scene: THREE.Scene): string {
    const objects: SerializedObject[] = [];

    scene.children.forEach((child) => {
      if (child.userData.metadata) {
        const obj: SerializedObject = {
          metadata: child.userData.metadata,
          position: {
            x: child.position.x,
            y: child.position.y,
            z: child.position.z,
          },
          rotation: {
            x: child.rotation.x,
            y: child.rotation.y,
            z: child.rotation.z,
          },
          scale: {
            x: child.scale.x,
            y: child.scale.y,
            z: child.scale.z,
          },
        };
        objects.push(obj);
      }
    });

    const sceneData: SceneData = {
      version: "1.0.0",
      objects,
    };

    return JSON.stringify(sceneData, null, 2);
  }

  static downloadJSON(data: string, filename: string = "scene.json"): void {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}