import "@esri/calcite-components/dist/calcite/calcite.css";
import "@esri/calcite-components/dist/components/calcite-loader";
import Application from "./widgets/Application";
import { marsImageryBasemap, marsSR, marsElevation } from "./widgets/layers";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import { addFrameTask } from "@arcgis/core/core/scheduling";

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

const stopSpin = addFrameTask({
  update: () => {
    if (!view.interacting) {
      const camera = view?.camera.clone();
      camera.position.longitude -= 0.04;
      view.camera = camera;
    } else {
      stopSpin.remove();
    }
  },
});

// eslint-disable-next-line no-new
new Application({
  container: "application",
  // @ts-expect-error dunno how to fix this type error...
  view,
});

(window as any).view = view;
