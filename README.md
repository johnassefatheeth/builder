# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # Zemmenay — Interactive 3D/2D Builder

    A lightweight, React + Three.js based scene builder for creating, editing and sketching 3D scenes with first-class 2D sketching tools. Zemmenay focuses on an approachable UI (toolbar + canvas) for creating primitives, sketching flat 2D shapes, manipulating objects with transform controls, and a simple undo/redo history that understands object transforms.

    This README explains the project structure, how to set up and run the project, how to use the sketch tools and transform/undo system, developer notes, and recommended next steps.

    ---

    ## Highlights / Key Features

    - React + TypeScript + Three.js application scaffolded with Vite.
    - Scene management with `SceneManager` for camera, renderer, helpers and managers.
    - SelectionManager with click-to-select and visual highlight.
    - Transform controls integrated (translate / rotate / scale) with transform-history recording so Undo/Redo properly reverts transforms.
    - 2D Sketch mode that creates true flat 2D shapes (with extrusion) on the scene XZ plane.
      - Supported shapes: Rectangle, Circle, Triangle, Ellipse, Regular Polygon (n sides).
      - Hollow mode: draws thin outlines (LineLoop) instead of filled meshes for a clean 2D sketch look.
    - Toolbar UI for creating primitives, entering Sketch mode, toggling sketch options, and manipulating view.
    - Export / Import support (JSON scene export/import).

    ---

    ## Project structure (important files)

    - `index.html`, `vite.config.ts`, `package.json` — project entry / build tooling.
    - `src/main.tsx`, `src/App.tsx` — React app entry and top-level UI wiring.
    - `src/components/Toolbar.tsx` — Top toolbar UI. Contains tool buttons and sketch options (grid size, snap, hollow, polygon sides).
    - `src/components/CanvasView.tsx` — The 3D canvas component that creates the `SceneManager` and wires events.
    - `src/core/SceneManager.ts` — Central scene manager (camera, renderer, orbit controls, managers).
    - `src/core/SelectionManager.ts` — Raycast-based selection and highlighting logic.
    - `src/core/TransformControlsManager.ts` — Wraps three-stdlib TransformControls and records transform start/end for history.
    - `src/core/SketchManager.ts` — Sketch tool that builds flat 2D `THREE.Shape` objects and outlines. Implements rectangle/circle/triangle/ellipse/polygon, preview and final creation, snapping, hollow outlines, grid helper.
    - `src/store/useSceneStore.ts` — Zustand store for app state, objects list and undo/redo history. History entries now include transform records so undo/redo reverts transforms as well as add/remove.
    - `src/utils/exporters.ts` / `src/utils/importers.ts` — Scene export/import helpers.

    ---

    ## Setup

    Prerequisites:
    - Node.js 18+ (or compatible). Use `nvm` if you need multiple versions.

    Install dependencies:

    ```powershell
    npm install
    ```

    Start the development server:

    ```powershell
    npm run dev
    ```

    Build for production:

    ```powershell
    npm run build
    ```

    Preview a production build:

    ```powershell
    npm run preview
    ```

    Typecheck only (no emit):

    ```powershell
    npx tsc --noEmit
    ```

    ---

    ## How to use the app (quick tour)

    1. Open the app in your browser (Vite prints a local URL when you run `npm run dev`).
    2. The toolbar at the top contains tabs: `Home`, `Insert`, `Sketch`, `Transform`, `File`.

    Toolbar quick actions:
    - Home: Undo / Redo, Delete selection, Toggle visibility of selected object, View mode toggles.
    - Insert: Create primitive 3D shapes (Box, Sphere, Cone, Cylinder, Torus, Plane).
    - Sketch: Enter Sketch mode and choose a shape to draw. Sketch options allow:
      - Hollow (outline mode) toggle — draws a thin line outline instead of a filled mesh.
      - Snap to grid toggle and grid size (editable) — when enabled the sketch points snap to a grid.
      - Polygon sides (number) — when `Polygon` sketch tool is selected this controls the number of polygon sides.
    - Transform: Switch the TransformControls mode (Translate / Rotate / Scale).
    - File: Export / Import scene JSON, Clear Scene.

    Sketch tools available:
    - Rectangle — click-and-drag to define the opposite corners (centered on creation).
    - Circle — click to set center, drag to set radius.
    - Triangle — isosceles triangle centered on start point.
    - Ellipse — center at start, drag to set x/y radii.
    - Polygon — regular polygon with configurable side count; radius is set by dragging.

    Hollow mode behavior:
    - When Hollow is ON the sketch creates thin outlines using `THREE.LineLoop` (no filled geometry). This is intended to produce crisp 2D sketch lines.
    - When Hollow is OFF the shape is a filled `THREE.Mesh` using `THREE.ShapeGeometry` and a standard material.

    Selection and editing:
    - Click on an object to select it. The `SelectionManager` highlights the selected object by swapping its material.
    - Selected object appears in the app state and is editable via Transform controls.
    - Transform interactions (dragging the TransformControls) are recorded to the history as a before/after transform entry so Undo/Redo will revert the full transform.

    Undo / Redo behavior:
    - The history stores add/remove operations as before, and additionally stores transform operations of the form `{ type: 'transform', uuid, before, after }`.
    - Undo will revert the last history entry (remove added object, re-add removed object, or apply the `before` transform for transform entries).
    - Redo applies the corresponding inverse operation (reapply `after` for transform entries).

    Export / Import:
    - Use File → Export to download a JSON file describing the scene.
    - Use File → Import to load a previously exported scene. Import clears the current scene and populates it with the imported objects.

    ---

    ## Developer Notes

    Design decisions made in this branch:

    - Sketch shapes are true 2D: the `SketchManager` builds `THREE.Shape` instances and uses `ShapeGeometry` (flat meshes) rather than extruding them. Outline/hollow mode uses `LineLoop` so sketches look like 2D strokes.
    - Selection relies on `userData.metadata` being present on top-level sketch groups so `SelectionManager` filters the scene for selectable objects.
    - Transform undo/redo records are emitted at drag start and drag end in `TransformControlsManager` — we capture the `before` transform once, and on drag end we capture `after` and record a single transform history entry. This keeps the history concise (one entry per drag session).
    - The Zustand store (`useSceneStore`) now understands three kinds of history entries: add, remove, and transform. `undo`/`redo` updated to handle `transform` entries.

    Edge cases & limitations:
    - If an object is removed and then re-created with a different UUID, transform history entries that point to the old UUID will not apply to the new object.
    - Outline `LineLoop` thickness is platform/browser dependent (WebGL `linewidth` is not reliably supported across all systems). For thicker outlines consider using a screen-space line shader or extruded thin rectangle geometry.
    - The ellipse implementation uses `EllipseCurve` sampled to points and made into a shape; extreme aspect ratios may require tuning of sampling resolution.
    - History recording for transforms currently records only the start/end states. If you want continuous granular undo/redo during a drag operation (e.g., revert to intermediate states) the manager would need to record at intervals or per-frame (not implemented to keep history compact).

    ---

    ## Extending the Toolbar / UI

    If you want the toolbar to expose more options (for example: outline thickness, inner-hole ratio, polygon presets), the toolbar is implemented in `src/components/Toolbar.tsx` and the sketch manager API supports the following methods you can call from the toolbar:

    - `sceneManager.sketchManager.enableSketchMode(tool, hollow, polygonSides?)` — `tool` is one of `"rectangle" | "circle" | "triangle" | "ellipse" | "polygon"`.
    - `sceneManager.sketchManager.disableSketchMode()` — leave sketch mode.
    - `sceneManager.sketchManager.setSnapToGrid(boolean)`
    - `sceneManager.sketchManager.setGridSize(number)`
    - `sceneManager.sketchManager.setHollow(boolean)`

    Add toolbar inputs to call those methods and update local toolbar state accordingly.

    ---

    ## Troubleshooting

    - Selection not working for sketches:
      - Ensure shapes (returned `THREE.Group` from `SketchManager.createShape`) have `group.userData.metadata` set — `SelectionManager` filters scene children by this metadata.
    - Undo/Redo not reverting transforms:
      - Verify `TransformControlsManager` emits `recordTransform` at drag end; the store listens and pushes a transform history entry.
    - Hollow outlines too thin or invisible:
      - WebGL linewidth limitations mean you may need to use a dedicated line rendering approach if you need thick, consistent strokes. Consider using `three-fatline` or generating thin extruded geometry for outlines.

    ---

    ## Development tips and testing

    - When editing scene or manager code, reload the page and test interactive behaviors (selection, transform, undo).
    - Use the browser console to access the `sceneManager` if you expose it from a top-level React reference for rapid experimentation:

    ```js
    // example in dev console (if `sceneManager` is globally reachable)
    sceneManager.sketchManager.enableSketchMode('polygon', false, 6);
    ```

    - Run TypeScript checks often:

    ```powershell
    npx tsc --noEmit
    ```

    ---

    ## Contribution & License

    This project is provided as-is. If you want me to add features, tests, or CI integration, open an issue or request it here and I can implement the changes.

    If you plan to publish or redistribute, add a `LICENSE` file with your preferred license.

    ---

    ## Next steps I can help with

    - Add toolbar controls to select ellipse/polygon from the UI (already partially wired: polygon sides control, tool buttons added). I can polish UI/UX.
    - Persist scene to localStorage / autosave drafts.
    - Add an operations panel listing history entries with ability to jump to a specific point.
    - Improve hollow outline rendering for consistent line width across platforms.
    - Add unit/integration tests for `useSceneStore` undo/redo logic.

    If you'd like any of the above, tell me which and I will implement it next.

    ---

    Happy building! If you want I can now run a typecheck and a production build and fix any errors you see locally — tell me which to run and I'll execute it and iterate on any issues found.
