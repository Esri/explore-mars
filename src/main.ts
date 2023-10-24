import "@esri/calcite-components/dist/calcite/calcite.css";
import "@esri/calcite-components/dist/components/calcite-loader";
import "./general.scss";
import "./esri-widget-customizations.scss";
import Application from "./application/Application";
import { marsImageryBasemap, marsSR, marsElevation } from "./application/layers";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import { addFrameTask } from "@arcgis/core/core/scheduling";
import { when } from "@arcgis/core/core/reactiveUtils";
import AppState from "./application/AppState";

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
      directShadowsEnabled: true,
    },
  },
  camera: {
    position: {
      x: 360 * Math.random() - 180,
      y: 90 * Math.random() - 45,
      z: 6500000,
      spatialReference: { wkid: 104971 },
    },
    heading: 0.0,
    tilt: 10,
  },
});

view.ui.remove("attribution");
view.map.ground.layers.add(marsElevation);

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
      camera.position.longitude -= 0.04;
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

when(() => AppState.page !== 'landing', () => { spinGlobe.remove(); });

(window as any).view = view;
