import * as THREE from "three";
import { ShapeFactory } from "../core/ShapeFactory";
import type { SceneData, SerializedObject } from "./exporters";

export class SceneImporter {
  static importScene(jsonData: string): THREE.Group[] {
    try {
      const sceneData: SceneData = JSON.parse(jsonData);
      const objects: THREE.Group[] = [];

      sceneData.objects.forEach((serializedObj: SerializedObject) => {
        const obj = this.deserializeObject(serializedObj);
        if (obj) {
          objects.push(obj);
        }
      });

      return objects;
    } catch (error) {
      console.error("Failed to import scene:", error);
      return [];
    }
  }

  private static deserializeObject(
    serializedObj: SerializedObject
  ): THREE.Group | null {
    const { metadata, position, rotation, scale } = serializedObj;
    let obj: THREE.Group | null = null;

    switch (metadata.type) {
      case "box":
        obj = ShapeFactory.createBox(
          metadata.parameters.width,
          metadata.parameters.height,
          metadata.parameters.depth
        );
        break;
      case "cone":
        obj = ShapeFactory.createCone(
          metadata.parameters.radius,
          metadata.parameters.height,
          metadata.parameters.radialSegments
        );
        break;
      case "torus":
        obj = ShapeFactory.createTorus(
          metadata.parameters.radius,
          metadata.parameters.tube,
          metadata.parameters.radialSegments,
          metadata.parameters.tubularSegments
        );
        break;
      case "plane":
        obj = ShapeFactory.createPlane(
          metadata.parameters.width,
          metadata.parameters.height
        );
        break;
      case "sphere":
        obj = ShapeFactory.createSphere(
          metadata.parameters.radius,
          metadata.parameters.widthSegments,
          metadata.parameters.heightSegments
        );
        break;
      case "cylinder":
        obj = ShapeFactory.createCylinder(
          metadata.parameters.radiusTop,
          metadata.parameters.radiusBottom,
          metadata.parameters.height,
          metadata.parameters.radialSegments
        );
        break;
      case "extruded":
        // For extruded shapes, we'd need to store and recreate the shape
        // This is a simplified version
        console.warn("Extruded shape import not fully implemented");
        break;
    }

    if (obj) {
      obj.position.set(position.x, position.y, position.z);
      obj.rotation.set(rotation.x, rotation.y, rotation.z);
      obj.scale.set(scale.x, scale.y, scale.z);
      // ensure imported objects have metadata stored under userData.metadata
      // and also keep metadata on the group for backward compatibility
      (obj as any).metadata = metadata;
      obj.userData = { metadata };
    }

    return obj;
  }

  static loadFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}