import React, { useState, useEffect } from "react";
import { CanvasView } from "./components/CanvasView";
import { Toolbar } from "./components/Toolbar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { SceneManager } from "./core/SceneManager";
import { useSceneStore } from "./store/useSceneStore";

const App: React.FC = () => {
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const { setTransformMode } = useSceneStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "t" || e.key === "T") {
        setTransformMode("translate");
      } else if (e.key === "r" || e.key === "R") {
        setTransformMode("rotate");
      } else if (e.key === "s" || e.key === "S") {
        setTransformMode("scale");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [setTransformMode]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      <Toolbar sceneManager={sceneManager} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative bg-gray-200">
          <CanvasView onSceneManagerReady={setSceneManager} />
        </div>
  <PropertiesPanel sceneManager={sceneManager} />
      </div>
    </div>
  );
};

export default App;