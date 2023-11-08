import "@esri/calcite-components/dist/calcite/calcite.css";
import "@esri/calcite-components/dist/components/calcite-loader";
import "./general.scss";
import "./esri-widget-customizations.scss";
import Application from "./application/Application";
import {
  marsImageryBasemap,
  marsSR,
  marsElevation,
  marsNamesLayer,
  missionLayer,
} from "./utilities/layers";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import { addFrameTask } from "@arcgis/core/core/scheduling";
import { when } from "@arcgis/core/core/reactiveUtils";
import AppState from "./application/AppState";
import {
  perseveranceLayers,
  curiosityLayers,
  opportunityLayers,
} from "./utilities/rover-layers";

const map = new Map({
  basemap: marsImageryBasemap,
  ground: {
    surfaceColor: [144, 106, 100],
  },
});

const view = new SceneView({
  container: "viewDiv",
  map,
  qualityProfile: "high",
  spatialReference: marsSR,
  environment: {
    lighting: {
      type: "virtual",
      directShadowsEnabled: true,
    },
  },
  camera: {
    position: {
      spatialReference: {
        wkid: 104971,
      },
      x: -57.10234077359152,
      y: -24.37565105257643,
      z: 839844.3044310743,
    },
    heading: 293.23407097843636,
    tilt: 43.952125030140685,
  },
});
view.ui.remove("attribution");
view.map.ground.layers.add(marsElevation);
view.map.layers.addMany([
  marsNamesLayer,
  missionLayer,
  perseveranceLayers,
  curiosityLayers,
  opportunityLayers,
]);

const popup = view.popup;
popup.actions?.removeAll();
popup.dockEnabled = true;
popup.dockOptions = {
  buttonEnabled: false,
  position: "top-right",
  breakpoint: false,
};

popup.spinnerEnabled = true;
popup.collapseEnabled = false;

const spinGlobe = addFrameTask({
  update: () => {
    if (!view.interacting) {
      const camera = view?.camera.clone();
      camera.position.longitude -= 0.01;
      view.camera = camera;
    } else {
      spinGlobe.remove();
    }
  },
});

AppState.view = view;

// eslint-disable-next-line no-new
const app = new Application({
  container: "application",
});

when(
  () => AppState.page !== "landing",
  () => {
    spinGlobe.remove();
  },
);

(window as any).view = view;
