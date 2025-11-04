import { create } from "zustand";
import * as THREE from "three";
import type { SceneManager } from "../core/SceneManager";

export interface SelectedEntity {
  type: "shape" | "edge" | "face" | null;
  object: THREE.Object3D | null;
  faceIndex?: number;
  edgeIndex?: number;
}

type TransformData = {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
};

type HistoryEntry =
  | { type: "add"; object: THREE.Object3D }
  | { type: "remove"; object: THREE.Object3D }
  | { type: "transform"; uuid: string; before: TransformData; after: TransformData };

interface SceneStore {
  mode: "3D" | "SKETCH";
  viewMode: "wireframe" | "default" | "realistic";
  selected: SelectedEntity;
  transformMode: "translate" | "rotate" | "scale";
  objects: THREE.Object3D[];
  sketchPlane: THREE.Mesh | null;

  // Undo/redo stacks store operations performed on objects (add/remove/transform)
  past: HistoryEntry[];
  future: HistoryEntry[];

  // Actions
  setMode: (mode: "3D" | "SKETCH") => void;
  setSelected: (entity: SelectedEntity) => void;
  setTransformMode: (mode: "translate" | "rotate" | "scale") => void;
  addObject: (object: THREE.Object3D) => void;
  removeObject: (object: THREE.Object3D) => void;
  // Record a transform change (before/after transforms) for an object identified by uuid
  recordTransform: (uuid: string, before: TransformData, after: TransformData) => void;
  // Undo/redo actions (receive optional SceneManager to update scene)
  undo: (sceneManager?: SceneManager) => void;
  redo: (sceneManager?: SceneManager) => void;
  clearAll: (sceneManager?: SceneManager) => void;
  removeSelected: (sceneManager?: SceneManager) => void;
  toggleSelectedVisibility: () => void;
  setObjectVisibility: (object: THREE.Object3D, visible: boolean) => void;
  setViewMode: (mode: "wireframe" | "default" | "realistic") => void;
  clearObjects: () => void;
  setSketchPlane: (plane: THREE.Mesh | null) => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  mode: "3D",
  viewMode: "default",
  selected: { type: null, object: null },
  transformMode: "translate",
  objects: [],
  sketchPlane: null,
  past: [],
  future: [],

  setMode: (mode) => set({ mode }),
  setSelected: (entity) => set({ selected: entity }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  addObject: (object) =>
    set((state) => {
      // record the add operation to past and clear future
      const past = [...state.past, { type: "add", object } as HistoryEntry];
      return { objects: [...state.objects, object], past, future: [] };
    }),
  removeObject: (object) =>
    set((state) => {
      const past = [...state.past, { type: "remove", object } as HistoryEntry];
      return {
        objects: state.objects.filter((obj) => obj.uuid !== object.uuid),
        past,
        future: [],
      };
    }),
  recordTransform: (uuid, before, after) =>
    set((state) => {
      // If no actual change, don't record
      const same =
        before.position.toString() === after.position.toString() &&
        before.quaternion.toString() === after.quaternion.toString() &&
        before.scale.toString() === after.scale.toString();
      if (same) return state;
      const entry: HistoryEntry = { type: "transform", uuid, before, after };
      const past = [...state.past, entry];
      return { ...state, past, future: [] };
    }),
  undo: (sceneManager) =>
    set((state) => {
      const past = [...state.past];
      const future = [...state.future];
      if (past.length === 0) return state;
      const op = past.pop()!; // last operation
      if (op.type === "add") {
        // undo add -> remove object
        const objects = state.objects.filter((o) => o.uuid !== op.object.uuid);
        future.push(op);
        // update scene if provided
        if (sceneManager) sceneManager.removeShape(op.object);
        return { ...state, objects, past, future };
      } else if (op.type === "remove") {
        // undo remove -> add object back
        const objects = [...state.objects, op.object];
        future.push(op);
        if (sceneManager) sceneManager.addShape(op.object as any);
        return { ...state, objects, past, future };
      } else {
        // transform undo: apply 'before' transform
        const entry = op;
        // try to find object in objects list
        const objects = state.objects.map((o) => {
          if (o.uuid === entry.uuid) {
            o.position.set(entry.before.position[0], entry.before.position[1], entry.before.position[2]);
            o.quaternion.set(
              entry.before.quaternion[0],
              entry.before.quaternion[1],
              entry.before.quaternion[2],
              entry.before.quaternion[3]
            );
            o.scale.set(entry.before.scale[0], entry.before.scale[1], entry.before.scale[2]);
          }
          return o;
        });
        future.push(op);
        // also update scene object if sceneManager provided
        if (sceneManager) {
          const sceneObj = sceneManager.scene.getObjectByProperty("uuid", entry.uuid) as THREE.Object3D | undefined;
          if (sceneObj) {
            sceneObj.position.set(entry.before.position[0], entry.before.position[1], entry.before.position[2]);
            sceneObj.quaternion.set(
              entry.before.quaternion[0],
              entry.before.quaternion[1],
              entry.before.quaternion[2],
              entry.before.quaternion[3]
            );
            sceneObj.scale.set(entry.before.scale[0], entry.before.scale[1], entry.before.scale[2]);
          }
        }
        return { ...state, objects, past, future };
      }
    }),
  redo: (sceneManager) =>
    set((state) => {
      const past = [...state.past];
      const future = [...state.future];
      if (future.length === 0) return state;
      const op = future.pop()!;
      if (op.type === "add") {
        // redo add -> add object
        const objects = [...state.objects, op.object];
        past.push(op);
        if (sceneManager) sceneManager.addShape(op.object as any);
        return { ...state, objects, past, future };
      } else if (op.type === "remove") {
        // redo remove -> remove object
        const objects = state.objects.filter((o) => o.uuid !== op.object.uuid);
        past.push(op);
        if (sceneManager) sceneManager.removeShape(op.object);
        return { ...state, objects, past, future };
      } else {
        // redo transform: apply 'after' transform
        const entry = op;
        const objects = state.objects.map((o) => {
          if (o.uuid === entry.uuid) {
            o.position.set(entry.after.position[0], entry.after.position[1], entry.after.position[2]);
            o.quaternion.set(
              entry.after.quaternion[0],
              entry.after.quaternion[1],
              entry.after.quaternion[2],
              entry.after.quaternion[3]
            );
            o.scale.set(entry.after.scale[0], entry.after.scale[1], entry.after.scale[2]);
          }
          return o;
        });
        past.push(op);
        if (sceneManager) {
          const sceneObj = sceneManager.scene.getObjectByProperty("uuid", entry.uuid) as THREE.Object3D | undefined;
          if (sceneObj) {
            sceneObj.position.set(entry.after.position[0], entry.after.position[1], entry.after.position[2]);
            sceneObj.quaternion.set(
              entry.after.quaternion[0],
              entry.after.quaternion[1],
              entry.after.quaternion[2],
              entry.after.quaternion[3]
            );
            sceneObj.scale.set(entry.after.scale[0], entry.after.scale[1], entry.after.scale[2]);
          }
        }
        return { ...state, objects, past, future };
      }
    }),
    clearAll: (sceneManager) =>
      set((state) => {
        if (state.objects.length === 0) return state;
        const past = [...state.past];
        // record all current objects as remove operations
        state.objects.forEach((obj) =>
          past.push({ type: "remove", object: obj } as { type: "remove"; object: THREE.Object3D })
        );
        const future: typeof state.future = [];
        // remove all from scene if sceneManager provided
        if (sceneManager) {
          state.objects.forEach((obj) => sceneManager.removeShape(obj));
        }
        return { ...state, objects: [], past, future };
      }),
    removeSelected: (sceneManager) =>
      set((state) => {
        const selected = state.selected;
        if (!selected || !selected.object) return state;
        const obj = selected.object;
        // record removal in past
        const past = [...state.past, { type: "remove", object: obj } as { type: "remove"; object: THREE.Object3D }];
        const objects = state.objects.filter((o) => o.uuid !== obj.uuid);
        // remove from scene if manager provided
        if (sceneManager) sceneManager.removeShape(obj);
        return { ...state, objects, past, future: [], selected: { type: null, object: null } };
      }),
    toggleSelectedVisibility: () =>
      set((state) => {
        const sel = state.selected;
        if (!sel || !sel.object) return state;
        const newVis = !sel.object.visible;
        // update object visibility in objects array as well
        const objects = state.objects.map((o) => (o.uuid === sel.object!.uuid ? ({ ...o, visible: newVis } as any) : o));
        sel.object.visible = newVis;
        return { ...state, objects, selected: { ...sel, object: sel.object } };
      }),
    clearObjects: () => set({ objects: [] }),
    setObjectVisibility: (object, visible) =>
      set((state) => {
        const objects = state.objects.map((o) => {
          if (o.uuid === object.uuid) {
            o.visible = visible;
          }
          return o;
        });

        const selected = state.selected.object && state.selected.object.uuid === object.uuid
          ? { ...state.selected, object }
          : state.selected;

        return { ...state, objects: [...objects], selected };
      }),
    setViewMode: (mode) => set({ viewMode: mode }),
  setSketchPlane: (plane) => set({ sketchPlane: plane }),
}));