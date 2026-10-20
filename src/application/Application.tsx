import { useEffect, useRef, useState } from "react";
import type SceneView from "@arcgis/core/views/SceneView";
import Camera from "@arcgis/core/Camera";
import type { ArcgisScene } from "@arcgis/map-components/components/arcgis-scene";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { addFrameTask } from "@arcgis/core/core/scheduling";
import { LocationPage } from "../location/LocationPage";
import { MeasurePage } from "../measure/MeasurePages";
import { ComparePage } from "../compare/ComparePage";
import { CreditsPage } from "../credits/CreditsPage";
import { LandingPage } from "../home/HomePage";
import { CookieBanner } from "../utility-components/CookieBanner";
import { BasemapSwitcher } from "./BasemapSwitcher";
import { createSceneResources, initialCamera } from "./scene";
import { errorMessage, isAbortError } from "../utilities/errors";
import "@arcgis/map-components/components/arcgis-scene";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-action-bar";
import "@esri/calcite-components/components/calcite-alert";
import "@esri/calcite-components/components/calcite-loader";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-shell";
import "./Application.css";

type Panel = "locations" | "measure" | "compare" | "layers" | "about";
const tools = [
  { id: "locations", label: "Locations", icon: "map-pin" },
  { id: "measure", label: "Measure", icon: "measure" },
  { id: "compare", label: "Compare", icon: "compare" },
  { id: "layers", label: "Layers", icon: "layers" },
  { id: "about", label: "About Explore Mars", icon: "information" },
] as const;

export default function Application() {
  const [resources] = useState(createSceneResources);
  const [view, setView] = useState<SceneView | null>(null);
  const [panel, setPanel] = useState<Panel | null>("locations");
  const [welcome, setWelcome] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scene = useRef<ArcgisScene>(null);
  const panelElement = useRef<HTMLCalcitePanelElement>(null);
  const [heading, setHeading] = useState(0);

  const reportError = (cause: unknown) => {
    console.error(cause);
    setError(errorMessage(cause));
  };

  const navigate = (target: Parameters<SceneView["goTo"]>[0]) => {
    void view?.goTo(target).catch((cause: unknown) => {
      if (!isAbortError(cause)) {
        reportError(cause);
      }
    });
  };

  useEffect(() => {
    if (!view) {
      return;
    }
    const handle = reactiveUtils.watch(() => view.camera.heading, setHeading, {
      initial: true,
    });
    return () => handle.remove();
  }, [view]);

  useEffect(() => {
    const element = scene.current;
    if (!element) {
      return;
    }
    const handle = reactiveUtils.watch(
      () => element.fatalError,
      (cause) => {
        if (cause) {
          reportError(cause);
        }
      },
      { initial: true },
    );
    return () => handle.remove();
  }, [reportError]);

  useEffect(() => {
    if (!view || !welcome || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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

  useEffect(() => {
    if (panel) {
      void panelElement.current?.setFocus();
    }
  }, [panel]);

  const startExploring = () => {
    setWelcome(false);
    navigate(
      new Camera({
        position: {
          x: initialCamera.position.x,
          y: initialCamera.position.y,
          z: 8382276.030513974,
          spatialReference: { wkid: 104971 },
        },
        heading: initialCamera.heading,
        tilt: 0.15,
      }),
    );
  };

  return (
    <calcite-shell contentBehind>
      <arcgis-scene
        ref={scene}
        className="mars-scene"
        map={resources.map}
        spatialReference={resources.spatialReference}
        camera={initialCamera}
        environment={resources.environment}
        theme={resources.theme}
        popupDisabled
        onarcgisViewReadyChange={(event) => {
          if (event.currentTarget.ready) {
            setView(event.currentTarget.view);
          }
        }}
        onarcgisViewReadyError={(event) => reportError(event.detail)}
        onarcgisLoadError={(event) => reportError(event.detail)}
        aria-label="Interactive 3D globe of Mars"
      >
        {!view && !error && (
          <calcite-loader
            className="scene-loading"
            aria-live="polite"
            label="Loading Mars"
            text="Loading Mars"
          />
        )}

        <calcite-action-bar
          slot="top-left"
          aria-label="Scene navigation"
          floating
          expandToggleDisabled
        >
          <calcite-action
            text="Zoom in"
            icon="plus"
            disabled={!view}
            onClick={() => navigate({ zoom: (view?.zoom ?? 0) + 1 })}
          />
          <calcite-action
            text="Zoom out"
            icon="minus"
            disabled={!view}
            onClick={() => navigate({ zoom: (view?.zoom ?? 0) - 1 })}
          />
          <calcite-action
            text="Reset north"
            icon="compass"
            disabled={!view}
            onClick={() => {
              if (!view) {
                return;
              }
              const camera = view.camera.clone();
              camera.heading = 0;
              navigate(camera);
            }}
            style={{ "--calcite-action-icon-rotation": `${-heading}deg` }}
          />
          <calcite-action
            text="Home view"
            icon="home"
            disabled={!view}
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

        <calcite-action-bar
          slot="bottom-center"
          aria-label="Explore Mars tools"
          layout="horizontal"
          floating
          expandToggleDisabled
          selectionAppearance="highlight"
        >
          {tools.map((tool) => (
            <calcite-action
              key={tool.id}
              text={tool.label}
              icon={tool.icon}
              active={panel === tool.id}
              aria-pressed={panel === tool.id}
              aria-controls="tool-panel"
              disabled={!view}
              onClick={() => setPanel((current) => (current === tool.id ? null : tool.id))}
            />
          ))}
        </calcite-action-bar>

        {view && (
          <calcite-panel
            ref={panelElement}
            id="tool-panel"
            slot="top-right"
            className="tool-panel"
            heading={tools.find((tool) => tool.id === panel)?.label ?? ""}
            closable
            closed={!panel}
            oncalcitePanelClose={() => setPanel(null)}
          >
            {panel === "locations" && <LocationPage view={view} onError={reportError} />}
            {panel === "measure" && <MeasurePage view={view} />}
            <ComparePage view={view} resources={resources} active={panel === "compare"} />
            <BasemapSwitcher view={view} onError={reportError} active={panel === "layers"} />
            {panel === "about" && <CreditsPage />}
          </calcite-panel>
        )}
      </arcgis-scene>
      {error && (
        <calcite-alert
          slot="alerts"
          open
          kind="danger"
          label="Application error"
          queue="immediate"
          oncalciteAlertClose={(event) => {
            if (!event.currentTarget.open) {
              setError(null);
            }
          }}
        >
          <span slot="title">Something went wrong</span>
          <span slot="message">{error}</span>
        </calcite-alert>
      )}
      <LandingPage open={welcome} ready={view != null} onStart={startExploring} />
      <CookieBanner />
    </calcite-shell>
  );
}
