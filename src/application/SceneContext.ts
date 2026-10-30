import { createContext, use } from "react";
import type SceneView from "@arcgis/core/views/SceneView";
import type { SceneResources } from "./scene";

export interface SceneContextValue {
  view: SceneView;
  resources: SceneResources;
  reportError: (error: unknown) => void;
}

export const SceneContext = createContext<Promise<SceneContextValue> | null>(null);

export function useScene() {
  const scene = use(SceneContext);
  if (!scene) {
    throw new Error("Scene-dependent UI must be rendered inside the scene layout.");
  }
  return use(scene);
}
