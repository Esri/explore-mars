import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { addFrameTask } from "@arcgis/core/core/scheduling";
import { marsHiRiseImagery, marsImageryBasemap } from "../utilities/layers";
import { useScene } from "./SceneContext";

export function SceneEffects({ welcome }: { welcome: boolean }) {
  const { view, reportError } = useScene();
  const { mutate: updateVisibility, reset } = useMutation({
    mutationFn: () => view.hitTest({ x: view.width / 2, y: view.height / 2 }),
    networkMode: "always",
  });

  useEffect(() => {
    const update = () =>
      updateVisibility(undefined, {
        onSuccess: (result) => {
          marsHiRiseImagery.visible =
            result.ground?.mapPoint != null && (result.ground.distance ?? Infinity) < 10000;
        },
        onError: reportError,
      });
    const handles = [
      reactiveUtils.watch(
        () => view.map?.basemap,
        (basemap) => {
          view.environment.atmosphereEnabled = basemap === marsImageryBasemap;
        },
        { initial: true },
      ),
      reactiveUtils.when(() => view.stationary, update, { initial: true }),
    ];
    return () => {
      handles.forEach((handle) => handle.remove());
      reset();
    };
  }, [view, reportError, updateVisibility, reset]);

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
