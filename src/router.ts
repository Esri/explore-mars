import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from "@tanstack/react-router";
import Application from "./application/Application";
import { NotFoundPanel, PanelError, PanelLoading, ToolPanel } from "./application/ToolPanel";
import { comparisonModes, measurementTools, panels } from "./application/panels";

const rootRoute = createRootRoute({ component: Application });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => null,
});
const panelRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_panel",
  component: ToolPanel,
});
const locationsRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: panels.locations.to,
  staticData: {
    panelTitle: panels.locations.label,
  },
  component: lazyRouteComponent(() => import("./location/LocationPage"), "LocationPage"),
});
const measureRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: panels.measure.to,
  staticData: {
    panelTitle: panels.measure.label,
  },
  component: lazyRouteComponent(() => import("./measure/MeasurePage"), "MeasurePage"),
});
const measureIndexRoute = createRoute({
  getParentRoute: () => measureRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: measurementTools.line.to, replace: true });
  },
});
const lineRoute = createRoute({
  getParentRoute: () => measureRoute,
  path: "line",
  component: lazyRouteComponent(
    () => import("./measure/LineMeasurementPage"),
    "LineMeasurementPage",
  ),
});
const areaRoute = createRoute({
  getParentRoute: () => measureRoute,
  path: "area",
  component: lazyRouteComponent(
    () => import("./measure/AreaMeasurementPage"),
    "AreaMeasurementPage",
  ),
});
const elevationRoute = createRoute({
  getParentRoute: () => measureRoute,
  path: "elevation",
  component: lazyRouteComponent(
    () => import("./measure/ElevationProfilePage"),
    "ElevationProfilePage",
  ),
});
const compareRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: panels.compare.to,
  staticData: {
    panelTitle: panels.compare.label,
  },
  component: lazyRouteComponent(() => import("./compare/ComparePage"), "ComparePage"),
});
const compareIndexRoute = createRoute({
  getParentRoute: () => compareRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: comparisonModes.models.to, replace: true });
  },
});
const modelsRoute = createRoute({
  getParentRoute: () => compareRoute,
  path: "models",
  component: lazyRouteComponent(() => import("./compare/AddObject"), "AddObjectPage"),
});
const regionsRoute = createRoute({
  getParentRoute: () => compareRoute,
  path: "regions",
  staticData: {
    panelDescription: "Select a region on the globe",
  },
  component: lazyRouteComponent(() => import("./compare/AddRegion"), "AddRegionPage"),
});
const layersRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: panels.layers.to,
  staticData: {
    panelTitle: panels.layers.label,
  },
  component: lazyRouteComponent(() => import("./application/BasemapSwitcher"), "BasemapSwitcher"),
});
const aboutRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: panels.about.to,
  staticData: {
    panelTitle: panels.about.label,
  },
  component: lazyRouteComponent(() => import("./credits/CreditsPage"), "CreditsPage"),
});
const notFoundRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: "$",
  staticData: { panelTitle: "Page not found" },
  component: NotFoundPanel,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  panelRoute.addChildren([
    locationsRoute,
    measureRoute.addChildren([measureIndexRoute, lineRoute, areaRoute, elevationRoute]),
    compareRoute.addChildren([compareIndexRoute, modelsRoute, regionsRoute]),
    layersRoute,
    aboutRoute,
    notFoundRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPendingComponent: PanelLoading,
  defaultErrorComponent: PanelError,
  trailingSlash: "never",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
  interface StaticDataRouteOption {
    panelTitle?: string;
    panelDescription?: string;
  }
}
