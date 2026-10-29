import Map from "@arcgis/core/Map";
import Camera from "@arcgis/core/Camera";
import Environment from "@arcgis/core/views/3d/environment/Environment";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Theme from "@arcgis/core/views/Theme";
import { createMarsLayers } from "../utilities/layers";

export const initialCamera = new Camera({
  position: {
    spatialReference: { wkid: 104971 },
    x: -57.10234077359152,
    y: -24.37565105257643,
    z: 839844.3044310743,
  },
  heading: 293.23407097843636,
  tilt: 43.952125030140685,
});

export function createSceneResources() {
  const {
    spatialReference,
    imageryBasemap,
    reliefBasemap,
    hiRiseImagery,
    elevation,
    names,
    missions,
  } = createMarsLayers();
  const models = new GraphicsLayer({
    id: "add-object",
    title: "Earth models",
    elevationInfo: { mode: "relative-to-ground" },
  });
  const regions = new GraphicsLayer({
    title: "Earth regions",
    elevationInfo: { mode: "on-the-ground" },
  });
  const regionHandles = new GraphicsLayer({
    title: "Region editing handles",
    listMode: "hide",
    visible: false,
    elevationInfo: { mode: "on-the-ground" },
  });
  return {
    spatialReference,
    imageryBasemap,
    reliefBasemap,
    hiRiseImagery,
    theme: new Theme({ accentColor: "#f6a17b" }),
    environment: new Environment({
      lighting: { type: "virtual", directShadowsEnabled: true },
    }),
    map: new Map({
      basemap: imageryBasemap,
      ground: { surfaceColor: [144, 106, 100], layers: [elevation] },
      layers: [names, missions, regions, regionHandles, models],
    }),
    models,
    regions,
    regionHandles,
  };
}

export type SceneResources = ReturnType<typeof createSceneResources>;
