import React from "react";
import { useSceneStore } from "../store/useSceneStore";
import * as THREE from "three";
import type { SceneManager } from "../core/SceneManager";

interface PropertiesPanelProps {
  sceneManager?: SceneManager | null;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ sceneManager }) => {
  const { selected, objects } = useSceneStore();

  const handleSelect = (obj: THREE.Object3D) => {
    if (sceneManager && sceneManager.selectionManager) {
      sceneManager.selectionManager.selectObject(obj);
    } else {
      // fallback
      useSceneStore.getState().setSelected({ type: "shape", object: obj });
    }
  };

  const handleToggleVisibility = (obj: THREE.Object3D) => {
    useSceneStore.getState().setObjectVisibility(obj, !obj.visible);
  };

  return (
    <div className="w-80 h-full bg-slate-100 p-3 shadow-lg flex flex-col">
      <h2 className="text-xl font-bold text-slate-800 mb-3 px-2">Properties</h2>

  {/* Top: All objects list (top half) */}
  <div className="h-1/2 overflow-y-auto px-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Scene Objects</h3>
        <div className="space-y-2">
          {objects.length === 0 && (
            <div className="text-sm text-slate-500 italic">No objects in scene</div>
          )}
          {objects.map((obj) => {
            const meta = (obj as any).userData?.metadata || {};
            const name = meta.name || meta.guid?.substring(0, 8) || obj.name || obj.uuid.substring(0, 8);
            const isSelected = selected.object && selected.object.uuid === obj.uuid;
            return (
              <div
                key={obj.uuid}
                onClick={() => handleSelect(obj)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer border ${
                  isSelected ? "bg-blue-100 border-blue-300" : "bg-white border-slate-200"
                }`}
                title={meta.guid}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{name}</div>
                  <div className="text-xs text-slate-500">{meta.type || "Shape"}</div>
                </div>
                <div className="ml-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(obj);
                    }}
                    className={`px-2 py-1 text-xs rounded ${obj.visible ? "bg-slate-700 text-white" : "bg-yellow-400 text-slate-800"}`}
                    title={obj.visible ? "Hide" : "Show"}
                  >
                    {obj.visible ? "🚫 Hide" : "👁️ Show"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Selected object details */}
      <div className="h-1/2 overflow-y-auto px-2 pt-2 border-t border-slate-200">
        {!selected.object ? (
          <div className="text-sm text-slate-500 italic p-3">No object selected</div>
        ) : (
          (() => {
            const metadata = (selected.object as any).userData || {};
            const { position, rotation, scale } = selected.object;
            return (
              <div>
                <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-700 mb-2 pb-1 border-b-2 border-blue-500">Object Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-600">Type:</span>
                      <span className="text-sm font-semibold text-slate-900 font-mono">{metadata.type || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-600">ID:</span>
                      <span className="text-sm font-semibold text-slate-900 font-mono cursor-help" title={metadata.guid}>{metadata.guid?.substring(0, 8)}...</span>
                    </div>
                    {metadata.faceCount !== undefined && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-600">Faces:</span>
                        <span className="text-sm font-semibold text-slate-900 font-mono">{metadata.faceCount}</span>
                      </div>
                    )}
                    {metadata.edgeCount !== undefined && (
                      <div className="flex justify-between py-1.5">
                        <span className="text-sm font-medium text-slate-600">Edges:</span>
                        <span className="text-sm font-semibold text-slate-900 font-mono">{metadata.edgeCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-700 mb-2 pb-1 border-b-2 border-blue-500">Transform</h3>
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Position</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-sm font-medium text-slate-600">X:</span><span className="text-sm font-semibold text-slate-900 font-mono">{position.x.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-sm font-medium text-slate-600">Y:</span><span className="text-sm font-semibold text-slate-900 font-mono">{position.y.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1"><span className="text-sm font-medium text-slate-600">Z:</span><span className="text-sm font-semibold text-slate-900 font-mono">{position.z.toFixed(2)}</span></div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Rotation (rad)</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-sm font-medium text-slate-600">X:</span><span className="text-sm font-semibold text-slate-900 font-mono">{rotation.x.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-sm font-medium text-slate-600">Y:</span><span className="text-sm font-semibold text-slate-900 font-mono">{rotation.y.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1"><span className="text-sm font-medium text-slate-600">Z:</span><span className="text-sm font-semibold text-slate-900 font-mono">{rotation.z.toFixed(2)}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Scale</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-sm font-medium text-slate-600">X:</span><span className="text-sm font-semibold text-slate-900 font-mono">{scale.x.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-sm font-medium text-slate-600">Y:</span><span className="text-sm font-semibold text-slate-900 font-mono">{scale.y.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1"><span className="text-sm font-medium text-slate-600">Z:</span><span className="text-sm font-semibold text-slate-900 font-mono">{scale.z.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Parameters Section */}
                {metadata.parameters && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-700 mb-2 pb-1 border-b-2 border-blue-500">Parameters</h3>
                    <div className="space-y-1.5">
                      {Object.entries(metadata.parameters).map(([key, value], index) => (
                        <div key={key} className={`flex justify-between py-1 ${index < Object.entries(metadata.parameters).length - 1 ? "border-b border-slate-100" : ""}`}>
                          <span className="text-sm font-medium text-slate-600">{key}:</span>
                          <span className="text-sm font-semibold text-slate-900 font-mono">{typeof value === "number" ? value.toFixed(2) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};