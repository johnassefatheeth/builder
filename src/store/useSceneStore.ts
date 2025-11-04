import { create } from "zustand";
import * as THREE from "three";
import type { SceneManager } from "../core/SceneManager";

export interface SelectedEntity {
  type: "shape" | "edge" | "face" | null;
  object: THREE.Object3D | null;
  faceIndex?: number;
  edgeIndex?: number;
}

interface SceneStore {
  mode: "3D" | "SKETCH";
  viewMode: "wireframe" | "default" | "realistic";
  selected: SelectedEntity;
  transformMode: "translate" | "rotate" | "scale";
  objects: THREE.Object3D[];
  sketchPlane: THREE.Mesh | null;

  // Undo/redo stacks store operations performed on objects
  past: Array<{ type: "add" | "remove"; object: THREE.Object3D }>;
  future: Array<{ type: "add" | "remove"; object: THREE.Object3D }>;

  // Actions
  setMode: (mode: "3D" | "SKETCH") => void;
  setSelected: (entity: SelectedEntity) => void;
  setTransformMode: (mode: "translate" | "rotate" | "scale") => void;
  addObject: (object: THREE.Object3D) => void;
  removeObject: (object: THREE.Object3D) => void;
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
      const past = [...state.past, { type: "add", object } as { type: "add"; object: THREE.Object3D }];
      return { objects: [...state.objects, object], past, future: [] };
    }),
  removeObject: (object) =>
    set((state) => {
      const past = [...state.past, { type: "remove", object } as { type: "remove"; object: THREE.Object3D }];
      return {
        objects: state.objects.filter((obj) => obj.uuid !== object.uuid),
        past,
        future: [],
      };
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
        future.push({ type: "add", object: op.object });
        // update scene if provided
        if (sceneManager) sceneManager.removeShape(op.object);
        return { ...state, objects, past, future };
      } else {
        // undo remove -> add object back
        const objects = [...state.objects, op.object];
        future.push({ type: "remove", object: op.object });
        if (sceneManager) sceneManager.addShape(op.object as any);
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
        past.push({ type: "add", object: op.object });
        if (sceneManager) sceneManager.addShape(op.object as any);
        return { ...state, objects, past, future };
      } else {
        // redo remove -> remove object
        const objects = state.objects.filter((o) => o.uuid !== op.object.uuid);
        past.push({ type: "remove", object: op.object });
        if (sceneManager) sceneManager.removeShape(op.object);
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