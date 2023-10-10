import "@esri/calcite-components/dist/calcite/calcite.css";
import "@esri/calcite-components/dist/components/calcite-loader";
import AppState from "./widgets/AppState";
import Application from "./widgets/Application";
import HomePage from "./widgets/HomePage";

const home = new HomePage({ container: "viewDiv" });
const scene = home.init();

const appState = new AppState({
  homePage: home,
  view: scene,
});

const application = new Application({
  container: "application",
  // @ts-expect-error dunno how to fix this type error...
  appState,
});

(window as any).view = scene;
