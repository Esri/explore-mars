import { useEffect, useState } from "react";
import Camera from "@arcgis/core/Camera";
import type SceneView from "@arcgis/core/views/SceneView";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { useScene } from "./SceneContext";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-action-bar";

export function SceneNavigation() {
  const { view, reportError } = useScene();
  const [heading, setHeading] = useState(view.camera.heading);

  useEffect(() => {
    const handle = reactiveUtils.watch(() => view.camera.heading, setHeading, {
      initial: true,
    });
    return () => handle.remove();
  }, [view]);

  const navigate = (target: Parameters<SceneView["goTo"]>[0]) => {
    void view.goTo(target).catch(reportError);
  };

  return (
    <calcite-action-bar slot="top-left" aria-label="Scene navigation" floating expandToggleDisabled>
      <calcite-action
        text="Zoom in"
        icon="plus"
        onClick={() => navigate({ zoom: view.zoom + 1 })}
      />
      <calcite-action
        text="Zoom out"
        icon="minus"
        onClick={() => navigate({ zoom: view.zoom - 1 })}
      />
      <calcite-action
        text="Reset north"
        icon="compass"
        onClick={() => {
          const camera = view.camera.clone();
          camera.heading = 0;
          navigate(camera);
        }}
        style={{ "--calcite-action-icon-rotation": `${-heading}deg` }}
      />
      <calcite-action
        text="Home view"
        icon="home"
        onClick={() =>
          navigate(
            new Camera({
              position: {
                x: -57.1,
                y: -24.4,
                z: 8382276,
                spatialReference: { wkid: 104971 },
              },
              heading: 0,
              tilt: 0,
            }),
          )
        }
      />
    </calcite-action-bar>
  );
}
