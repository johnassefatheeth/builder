import React, { useRef, useState } from "react";
import { SceneManager } from "../core/SceneManager";
import * as THREE from "three";
import { ShapeFactory } from "../core/ShapeFactory";
import { useSceneStore } from "../store/useSceneStore";
import { SceneExporter } from "../utils/exporters";
import { SceneImporter } from "../utils/importers";

interface ToolbarProps {
  sceneManager: SceneManager | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ sceneManager }) => {
  const { mode, setMode, addObject, clearObjects, setTransformMode, selected, viewMode } =
    useSceneStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBox = () => {
    if (!sceneManager) return;
    const box = ShapeFactory.createBox(1, 1, 1);
    sceneManager.addShape(box);
    addObject(box);
  };

  const handleCreateSphere = () => {
    if (!sceneManager) return;
    const sphere = ShapeFactory.createSphere(0.5);
    sceneManager.addShape(sphere);
    addObject(sphere);
  };

  const handleCreateCylinder = () => {
    if (!sceneManager) return;
    const cylinder = ShapeFactory.createCylinder(0.5, 0.5, 1);
    sceneManager.addShape(cylinder);
    addObject(cylinder);
  };

  const handleCreateCone = () => {
    if (!sceneManager) return;
    const cone = ShapeFactory.createCone(0.5, 1, 32);
    sceneManager.addShape(cone);
    addObject(cone);
  };

  const handleCreateTorus = () => {
    if (!sceneManager) return;
    const torus = ShapeFactory.createTorus(0.6, 0.2, 16, 64);
    sceneManager.addShape(torus);
    addObject(torus);
  };

  const handleCreatePlane = () => {
    if (!sceneManager) return;
    const plane = ShapeFactory.createPlane(2, 2);
    sceneManager.addShape(plane);
    addObject(plane);
  };

  const [hollow, setHollow] = useState(false);

  const handleToggleSketchMode = (tool: "rectangle" | "circle" | "triangle") => {
    if (!sceneManager) return;
    if (mode === "SKETCH") {
      setMode("3D");
      sceneManager.sketchManager.disableSketchMode();
    } else {
      setMode("SKETCH");
      sceneManager.sketchManager.enableSketchMode(tool, hollow);
    }
  };

  const handleUndo = () => {
    if (!sceneManager) return;
    useSceneStore.getState().undo(sceneManager);
  };

  const handleRedo = () => {
    if (!sceneManager) return;
    useSceneStore.getState().redo(sceneManager);
  };

  const handleClearAll = () => {
    if (!sceneManager) return;
    // ask store to clear all and update scene
    useSceneStore.getState().clearAll(sceneManager);
  };

  const handleDeleteSelected = () => {
    if (!sceneManager) return;
    useSceneStore.getState().removeSelected(sceneManager);
  };

  const handleToggleVisibility = () => {
    const sel = useSceneStore.getState().selected;
    if (!sel || !sel.object) return;
    useSceneStore.getState().setObjectVisibility(sel.object, !sel.object.visible);
  };

  const handleExport = () => {
    if (!sceneManager) return;
    const jsonData = SceneExporter.exportScene(sceneManager.scene);
    SceneExporter.downloadJSON(jsonData);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!sceneManager || !e.target.files?.[0]) return;

    try {
      const file = e.target.files[0];
      const jsonData = await SceneImporter.loadFromFile(file);
      const objects = SceneImporter.importScene(jsonData);

      // Clear existing objects
      const currentObjects = useSceneStore.getState().objects;
      currentObjects.forEach((obj) => sceneManager.removeShape(obj));
      clearObjects();

      // Add imported objects
      objects.forEach((obj) => {
        sceneManager.addShape(obj);
        addObject(obj);
      });
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import scene. Please check the file format.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTransformMode = (mode: "translate" | "rotate" | "scale") => {
    setTransformMode(mode);
  };

  const applyViewMode = (mode: "wireframe" | "default" | "realistic") => {
    // update global store
    useSceneStore.getState().setViewMode(mode);
    if (!sceneManager) return;
    sceneManager.setViewMode(mode);
  };

  return (
    <div className="bg-slate-800 text-white px-4 py-3 shadow-lg">
      <div className="flex flex-wrap gap-6">
        {/* Create Primitives Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase text-slate-400 font-semibold mb-1">
            Create Primitives
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleCreateBox}
              title="Create Box"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              📦 Box
            </button>
            <button
              onClick={handleCreateCone}
              title="Create Cone"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              🔺 Cone
            </button>
            <button
              onClick={handleCreateSphere}
              title="Create Sphere"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              ⚪ Sphere
            </button>
            <button
              onClick={handleCreateCylinder}
              title="Create Cylinder"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              🥫 Cylinder
            </button>
            <button
              onClick={handleCreateTorus}
              title="Create Torus"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              🌀 Torus
            </button>
            <button
              onClick={handleCreatePlane}
              title="Create Plane"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              🗺️ Plane
            </button>
          </div>
        </div>

        {/* View Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase text-slate-400 font-semibold mb-1">View</h3>
          <div className="flex gap-2">
            <button
              onClick={() => applyViewMode("wireframe")}
              title="Wireframe View"
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                viewMode === "wireframe" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-700 hover:bg-blue-600 text-white"
              }`}
            >
              🕸️ Wireframe
            </button>

            <button
              onClick={() => applyViewMode("default")}
              title="Default View"
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                viewMode === "default" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-700 hover:bg-blue-600 text-white"
              }`}
            >
              🖼️ Default
            </button>

            <button
              onClick={() => applyViewMode("realistic")}
              title="Realistic View"
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                viewMode === "realistic" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-700 hover:bg-blue-600 text-white"
              }`}
            >
              🎞️ Realistic
            </button>
          </div>
        </div>

        {/* Sketch Tools Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase text-slate-400 font-semibold mb-1">
            Sketch Tools
          </h3>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handleToggleSketchMode("rectangle")}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                mode === "SKETCH"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-slate-700 hover:bg-blue-600"
              }`}
              title="Sketch Rectangle"
            >
              ▭ Rectangle
            </button>
            <button
              onClick={() => handleToggleSketchMode("circle")}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                mode === "SKETCH"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-slate-700 hover:bg-blue-600"
              }`}
              title="Sketch Circle"
            >
              ⭕ Circle
            </button>
            <button
              onClick={() => handleToggleSketchMode("triangle")}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                mode === "SKETCH"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-slate-700 hover:bg-blue-600"
              }`}
              title="Sketch Triangle"
            >
              🔺 Triangle
            </button>
            <button
              onClick={() => setHollow((s) => !s)}
              title="Toggle Hollow"
              className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200 active:scale-95 ${
                hollow ? "bg-yellow-600 hover:bg-yellow-700" : "bg-slate-700 hover:bg-blue-600"
              }`}
            >
              {hollow ? "Hollow: On" : "Hollow: Off"}
            </button>
          </div>
        </div>

        {/* Transform Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase text-slate-400 font-semibold mb-1">
            Transform (Shortcuts)
          </h3>
          <div className="flex gap-2 mb-2">
            <button
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              ↶ Undo
            </button>
            <button
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              ↷ Redo
            </button>
            <button
              onClick={handleClearAll}
              title="Clear All"
              className="bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              🗑️ Clear All
            </button>
            <button
              onClick={handleDeleteSelected}
              title="Delete Selected"
              disabled={!selected?.object}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                selected?.object ? "bg-red-600 hover:bg-red-500 text-white" : "bg-slate-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              🗑 Delete
            </button>
            <button
              onClick={handleToggleVisibility}
              title={selected?.object && selected.object.visible ? "Hide Selected" : "Show Selected"}
              disabled={!selected?.object}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95 ${
                selected?.object ? "bg-slate-700 hover:bg-blue-600 text-white" : "bg-slate-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {selected?.object && !selected.object.visible ? "👁️ Show" : "🚫 Hide"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleTransformMode("translate")}
              title="Move (T)"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              ↔️ Move
            </button>
            <button
              onClick={() => handleTransformMode("rotate")}
              title="Rotate (R)"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              🔄 Rotate
            </button>
            <button
              onClick={() => handleTransformMode("scale")}
              title="Scale (S)"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              ⤡ Scale
            </button>
            {/* Color picker for selected object */}
            <input
              type="color"
              value={
                selected?.object
                  ? // try to read color from first mesh child
                    (() => {
                      const mesh = selected.object.children.find((c) => (c as any).isMesh) as THREE.Mesh | undefined;
                      try {
                        const mat = mesh?.material as any;
                        return mat?.color ? `#${mat.color.getHexString()}` : "#ffffff";
                      } catch (e) {
                        return "#ffffff";
                      }
                    })()
                  : "#ffffff"
              }
              onChange={(e) => {
                const hex = e.target.value;
                const sel = useSceneStore.getState().selected;
                if (!sel || !sel.object || !sceneManager) return;
                const mesh = sel.object.children.find((c) => (c as any).isMesh) as THREE.Mesh | undefined;
                if (!mesh) return;
                const setColorOnMaterial = (mat: any) => {
                  if (!mat) return;
                  if (Array.isArray(mat)) {
                    mat.forEach((m) => m?.color && m.color.set(hex));
                  } else {
                    mat?.color && mat.color.set(hex);
                  }
                };

                // update visible material
                setColorOnMaterial(mesh.material as any);

                // update stored original material so color persists after deselect
                const origMap = (sceneManager.selectionManager as any).originalMaterials as
                  | Map<string, any>
                  | undefined;
                if (origMap) {
                  const orig = origMap.get(sel.object.uuid);
                  if (orig) setColorOnMaterial(orig);
                }
              }}
              disabled={!selected?.object}
              title={selected?.object ? "Change selected color" : "No selection"}
              className="ml-2 w-10 h-8 p-0 border-0 bg-transparent"
            />
          </div>
        </div>

        {/* File Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase text-slate-400 font-semibold mb-1">
            File
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              title="Export Scene"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              💾 Export JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import Scene"
              className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 active:scale-95"
            >
              📂 Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>
    </div>
  );
};