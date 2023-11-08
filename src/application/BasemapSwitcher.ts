import * as promiseUtils from "@arcgis/core/core/promiseUtils";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type SceneView from "@arcgis/core/views/SceneView";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";
import {
  marsHiRiseImagery,
  marsImageryBasemap,
  marsReconnaissanceImagery,
  shadedReliefBasemap,
} from "../utilities/layers";

/* Update visibility of HiRise basemaps depending on distance to camera */
async function updateBasemap(view: SceneView) {
  const result = await view.hitTest(
    { x: view.width / 2, y: view.height / 2 },
    { include: [view.map.ground] },
  );

  const d =
    result.ground.mapPoint != null ? result.ground.distance : Number.MAX_VALUE;
  marsReconnaissanceImagery.visible = d < 100000;
  marsHiRiseImagery.visible = d < 10000;
}

export function enableBasemapSwitcher(view: SceneView) {
  const toggle = new BasemapToggle({
    view,
    nextBasemap: shadedReliefBasemap,
  });

  reactiveUtils.watch(
    () => view.map.basemap,
    () => {
      view.environment.atmosphereEnabled =
        toggle.activeBasemap === marsImageryBasemap;
    },
  );

  view.ui.add(toggle, "bottom-right");

  const debouncedUpdateBasemap = promiseUtils.debounce(updateBasemap);

  reactiveUtils.when(
    () => view.stationary,
    () => {
      void debouncedUpdateBasemap(view);
    },
  );
}
