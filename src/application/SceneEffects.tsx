import { useEffect } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import * as promiseUtils from "@arcgis/core/core/promiseUtils";
import { addFrameTask } from "@arcgis/core/core/scheduling";
import { marsHiRiseImagery, marsImageryBasemap } from "../utilities/layers";
import { useScene } from "./SceneContext";

export function SceneEffects({ welcome }: { welcome: boolean }) {
  const { view, resources, reportError } = useScene();
  useEffect(() => {
    const controller = new AbortController();
    const updateVisibility = promiseUtils.debounce(async () => {
      const result = await view.hitTest(
        { x: view.width / 2, y: view.height / 2 },
        { include: [resources.map.ground] },
      );
      controller.signal.throwIfAborted();
      marsHiRiseImagery.visible =
        result.ground?.mapPoint != null && (result.ground.distance ?? Infinity) < 10000;
    });
    const handles = [
      reactiveUtils.watch(
        () => view.map?.basemap,
        (basemap) => {
          view.environment.atmosphereEnabled = basemap === marsImageryBasemap;
        },
        { initial: true },
      ),
      reactiveUtils.watch(
        () => view.stationary,
        (stationary) => {
          if (stationary) {
            void updateVisibility().catch(reportError);
          }
        },
        { initial: true },
      ),
    ];
    return () => {
      handles.forEach((handle) => handle.remove());
      controller.abort();
    };
  }, [view, resources, reportError]);

  useEffect(() => {
    if (!welcome || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const spin = addFrameTask({
      update: () => {
        if (view.interacting) {
          spin.remove();
          return;
        }
        const camera = view.camera.clone();
        if (camera.position.longitude != null) {
          camera.position.longitude -= 0.01;
          view.camera = camera;
        }
      },
    });
    return () => spin.remove();
  }, [view, welcome]);

  return null;
}
