import React, { useEffect, useRef } from "react";
import { SceneManager } from "../core/SceneManager";
import { useSceneStore } from "../store/useSceneStore";

interface CanvasViewProps {
  onSceneManagerReady: (manager: SceneManager) => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  onSceneManagerReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const { selected, transformMode } = useSceneStore();

  useEffect(() => {
    if (!canvasRef.current) return;

  const sceneManager = new SceneManager(canvasRef.current);
    sceneManagerRef.current = sceneManager;
    onSceneManagerReady(sceneManager);

    sceneManager.animate();

    const handleResize = () => sceneManager.handleResize();
    window.addEventListener("resize", handleResize);

    const handleClick = (e: MouseEvent) => {
      const currentMode = useSceneStore.getState().mode;
      if (currentMode === "3D") {
        sceneManager.selectionManager.handleClick(e, canvasRef.current!);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const currentMode = useSceneStore.getState().mode;
      if (currentMode === "SKETCH") {
        sceneManager.sketchManager.handleMouseDown(e, canvasRef.current!);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const currentMode = useSceneStore.getState().mode;
      if (currentMode === "SKETCH") {
        sceneManager.sketchManager.handleMouseMove(e, canvasRef.current!);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const currentMode = useSceneStore.getState().mode;
      if (currentMode === "SKETCH") {
        const shape = sceneManager.sketchManager.handleMouseUp(
          e,
          canvasRef.current!
        );
        console.debug("CanvasView.handleMouseUp -> shape returned:", shape);
        if (shape) {
          sceneManager.addShape(shape);
          useSceneStore.getState().addObject(shape);
        }
      }
    };

    const canvas = canvasRef.current;
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      sceneManager.dispose();
    };
  }, [onSceneManagerReady]);

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.transformControls.attachToObject(
        selected.object
      );
    }
  }, [selected]);

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.transformControls.setMode(transformMode);
    }
  }, [transformMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};