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
  const [activeTab, setActiveTab] = useState<string>("home");
  const [hollow, setHollow] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.5);
  const [selectedSketchTool, setSelectedSketchTool] = useState<string | null>(null);
  const [polygonSides, setPolygonSides] = useState<number>(5);

  // Handler functions remain the same as your original
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

  const handleToggleSketchMode = (tool: "rectangle" | "circle" | "triangle" | "ellipse" | "polygon") => {
    if (!sceneManager) return;
    // Toggle off when clicking the active tool
    if (mode === "SKETCH" && selectedSketchTool === tool) {
      setMode("3D");
      sceneManager.sketchManager.disableSketchMode();
      setSelectedSketchTool(null);
      return;
    }

    // apply current sketch options
    sceneManager.sketchManager.setSnapToGrid(snapToGrid);
    sceneManager.sketchManager.setGridSize(gridSize);
    sceneManager.sketchManager.setHollow(hollow);
    setMode("SKETCH");
    // pass polygonSides when relevant
    if (tool === "polygon") {
      sceneManager.sketchManager.enableSketchMode(tool, hollow, polygonSides);
    } else {
      sceneManager.sketchManager.enableSketchMode(tool, hollow);
    }
    setSelectedSketchTool(tool);
  };

  const toggleSnapToGrid = () => {
    const next = !snapToGrid;
    setSnapToGrid(next);
    if (sceneManager) sceneManager.sketchManager.setSnapToGrid(next);
  };

  const changeGridSize = (size: number) => {
    const next = Math.max(0.01, size);
    setGridSize(next);
    if (sceneManager) sceneManager.sketchManager.setGridSize(next);
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

      const currentObjects = useSceneStore.getState().objects;
      currentObjects.forEach((obj) => sceneManager.removeShape(obj));
      clearObjects();

      objects.forEach((obj) => {
        sceneManager.addShape(obj);
        addObject(obj);
      });
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import scene. Please check the file format.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTransformMode = (mode: "translate" | "rotate" | "scale") => {
    setTransformMode(mode);
  };

  const applyViewMode = (mode: "wireframe" | "default" | "realistic") => {
    useSceneStore.getState().setViewMode(mode);
    if (!sceneManager) return;
    sceneManager.setViewMode(mode);
  };

  // Tab definitions with their respective tool groups
  type ButtonTool = {
    type: "button";
    label: string;
    title?: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
  };
  type ToggleTool = {
    type: "toggle";
    label: string;
    title?: string;
    onClick: () => void;
    active?: boolean;
  };
  type ColorTool = {
    type: "color";
    label: string;
    title?: string;
    disabled?: boolean;
  };
  type NumberTool = {
    type: "number";
    label: string;
    title?: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (v: number) => void;
  };
  type Tool = ButtonTool | ToggleTool | ColorTool | NumberTool;
  type ToolGroup = { name: string; tools: Tool[] };
  type Tab = { name: string; groups: ToolGroup[] };

  const tabs: Record<string, Tab> = {
    home: {
      name: "Home",
      groups: [
        {
          name: "Clipboard",
          tools: [
            { type: "button", label: "↶ Undo", title: "Undo (Ctrl+Z)", onClick: handleUndo },
            { type: "button", label: "↷ Redo", title: "Redo (Ctrl+Y)", onClick: handleRedo },
          ]
        },
        {
          name: "Edit",
          tools: [
            { 
              type: "button", 
              label: "🗑️ Delete", 
              title: "Delete Selected", 
              onClick: handleDeleteSelected,
              disabled: !selected?.object 
            },
            { 
              type: "button", 
              label: selected?.object && !selected.object.visible ? "👁️ Show" : "🚫 Hide", 
              title: selected?.object && selected.object.visible ? "Hide Selected" : "Show Selected", 
              onClick: handleToggleVisibility,
              disabled: !selected?.object 
            },
          ]
        },
        {
          name: "View",
          tools: [
            { 
              type: "button", 
              label: "🕸️ Wireframe", 
              title: "Wireframe View", 
              onClick: () => applyViewMode("wireframe"),
              active: viewMode === "wireframe"
            },
            { 
              type: "button", 
              label: "🖼️ Default", 
              title: "Default View", 
              onClick: () => applyViewMode("default"),
              active: viewMode === "default"
            },
            { 
              type: "button", 
              label: "🎞️ Realistic", 
              title: "Realistic View", 
              onClick: () => applyViewMode("realistic"),
              active: viewMode === "realistic"
            },
          ]
        }
      ]
    },
    insert: {
      name: "Insert",
      groups: [
        {
          name: "Primitives",
          tools: [
            { type: "button", label: "📦 Box", title: "Create Box", onClick: handleCreateBox },
            { type: "button", label: "🔺 Cone", title: "Create Cone", onClick: handleCreateCone },
            { type: "button", label: "⚪ Sphere", title: "Create Sphere", onClick: handleCreateSphere },
            { type: "button", label: "🥫 Cylinder", title: "Create Cylinder", onClick: handleCreateCylinder },
            { type: "button", label: "🌀 Torus", title: "Create Torus", onClick: handleCreateTorus },
            { type: "button", label: "🗺️ Plane", title: "Create Plane", onClick: handleCreatePlane },
          ]
        }
      ]
    },
    sketch: {
      name: "Sketch",
      groups: [
        {
          name: "Sketch Tools",
            tools: [
            { 
              type: "button", 
              label: "▭ Rectangle", 
              title: "Sketch Rectangle", 
              onClick: () => handleToggleSketchMode("rectangle"),
              active: selectedSketchTool === "rectangle"
            },
            { 
              type: "button", 
              label: "⭕ Circle", 
              title: "Sketch Circle", 
              onClick: () => handleToggleSketchMode("circle"),
              active: selectedSketchTool === "circle"
            },
            { 
              type: "button", 
              label: "🔺 Triangle", 
              title: "Sketch Triangle", 
              onClick: () => handleToggleSketchMode("triangle"),
              active: selectedSketchTool === "triangle"
            },
            { 
              type: "button", 
              label: "◯ Ellipse", 
              title: "Sketch Ellipse", 
              onClick: () => handleToggleSketchMode("ellipse"),
              active: selectedSketchTool === "ellipse"
            },
            {
              type: "button",
              label: "🔷 Polygon",
              title: "Sketch Polygon",
              onClick: () => handleToggleSketchMode("polygon"),
              active: selectedSketchTool === "polygon"
            }
          ]
        },
        {
          name: "Sketch Options",
            tools: [
            {
              type: "toggle",
              label: hollow ? "🕳️ Hollow On" : "⏺️ Hollow Off",
              title: "Toggle Hollow",
              active: hollow,
              onClick: () => {
                const next = !hollow;
                setHollow(next);
                if (sceneManager) sceneManager.sketchManager.setHollow(next);
              }
            },
            {
              type: "toggle",
              label: snapToGrid ? "� Snap On" : "▫️ Snap Off",
              title: "Toggle Snap-to-Grid",
              active: snapToGrid,
              onClick: () => toggleSnapToGrid()
            },
            {
              type: "number",
              label: `Polygon Sides: ${polygonSides}`,
              title: "Polygon side count",
              value: polygonSides,
              min: 3,
              max: 12,
              step: 1,
              onChange: (v: number) => {
                const next = Math.max(3, Math.min(12, Math.floor(v)));
                setPolygonSides(next);
              }
            },
            {
              type: "number",
              label: `Grid Size: ${gridSize}`,
              title: "Grid size",
              value: gridSize,
              min: 0.01,
              max: 10,
              step: 0.01,
              onChange: (v: number) => {
                changeGridSize(v);
              }
            }
          ]
        }
      ]
    },
    transform: {
      name: "Transform",
      groups: [
        {
          name: "Transform Tools",
          tools: [
            { type: "button", label: "↔️ Move", title: "Move (T)", onClick: () => handleTransformMode("translate") },
            { type: "button", label: "🔄 Rotate", title: "Rotate (R)", onClick: () => handleTransformMode("rotate") },
            { type: "button", label: "⤡ Scale", title: "Scale (S)", onClick: () => handleTransformMode("scale") },
          ]
        },
        {
          name: "Properties",
          tools: [
            {
              type: "color",
              label: "Color",
              title: selected?.object ? "Change selected color" : "No selection",
              disabled: !selected?.object
            }
          ]
        }
      ]
    },
    file: {
      name: "File",
      groups: [
        {
          name: "Scene",
          tools: [
            { type: "button", label: "💾 Export", title: "Export Scene", onClick: handleExport },
            { type: "button", label: "📂 Import", title: "Import Scene", onClick: () => fileInputRef.current?.click() },
            { type: "button", label: "🗑️ Clear All", title: "Clear All", onClick: handleClearAll },
          ]
        }
      ]
    }
  };

  const currentTab = tabs[activeTab as keyof typeof tabs];

  return (
    <div className="bg-gray-900 border-b  shadow-sm">
      {/* Tab Navigation */}
      <div className="flex border-b ">
        {Object.entries(tabs).map(([key, tab]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeTab === key
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tool Groups */}
      <div className="px-4 py-3 bg-gray-900 min-h-[72px]">
        <div className="flex items-center gap-8">
          {currentTab.groups.map((group, index) => (
            <div key={index} className="flex items-center gap-4">
              {/* Group separator */}
              {index > 0 && (
                <div className="w-px h-8 bg-gray-300"></div>
              )}
              
              {/* Group label and tools */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                  {group.name}
                </span>
                <div className="flex gap-1">
                  {group.tools.map((tool, toolIndex) => (
                    <div key={toolIndex}>
                      {tool.type === "button" && (
                        <button
                          onClick={tool.onClick}
                          disabled={tool.disabled}
                          title={tool.title}
                          className={`px-3 py-2 text-sm rounded transition-colors duration-200 flex items-center gap-2 min-w-[80px] justify-center ${
                            tool.active
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : tool.disabled
                              ? "text-gray-400 cursor-not-allowed bg-gray-100"
                              : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 bg-white border border-gray-300"
                          }`}
                        >
                          {tool.label}
                        </button>
                      )}
                      
                      {tool.type === "toggle" && (
                        <button
                          onClick={tool.onClick}
                          title={tool.title}
                          className={`px-3 py-2 text-sm rounded transition-colors duration-200 flex items-center gap-2 min-w-[100px] justify-center ${
                            tool.active
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 bg-white border border-gray-300"
                          }`}
                        >
                          {tool.label}
                        </button>
                      )}
                      
                      {tool.type === "color" && (
                        <input
                          type="color"
                          value={
                            selected?.object
                              ? (() => {
                                  const mesh = selected.object.children.find((c) => (c as any).isMesh) as THREE.Mesh | undefined;
                                  try {
                                    const mat = mesh?.material as any;
                                    return mat?.color ? `#${mat.color.getHexString()}` : "#3b82f6";
                                  } catch (e) {
                                    return "#3b82f6";
                                  }
                                })()
                              : "#3b82f6"
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

                            setColorOnMaterial(mesh.material as any);

                            const origMap = (sceneManager.selectionManager as any).originalMaterials as
                              | Map<string, any>
                              | undefined;
                            if (origMap) {
                              const orig = origMap.get(sel.object.uuid);
                              if (orig) setColorOnMaterial(orig);
                            }
                          }}
                          disabled={tool.disabled}
                          title={tool.title}
                          className="w-10 h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400 transition-colors duration-200"
                        />
                      )}
                      {tool.type === "number" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={(tool as NumberTool).value}
                            min={(tool as NumberTool).min}
                            max={(tool as NumberTool).max}
                            step={(tool as NumberTool).step || 1}
                            onChange={(e) => (tool as NumberTool).onChange(Number(e.target.value))}
                            title={tool.title}
                            className="w-20 px-2 py-1 rounded border border-gray-300 bg-white text-sm"
                          />
                          <span className="text-xs text-gray-400">{tool.label}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
};