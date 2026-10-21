import { Suspense, useEffect, useRef, useState } from "react";
import { CatchBoundary, Outlet, useRouterState } from "@tanstack/react-router";
import type { ArcgisScene } from "@arcgis/map-components/components/arcgis-scene";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { LandingPage } from "../home/HomePage";
import { CookieBanner } from "../utility-components/CookieBanner";
import { SceneContext, type SceneContextValue } from "./SceneContext";
import { SceneEffects } from "./SceneEffects";
import { SceneNavigation } from "./SceneNavigation";
import { ToolToolbar } from "./ToolToolbar";
import { createSceneResources, initialCamera } from "./scene";
import { panels } from "./panels";
import { errorMessage } from "../utilities/errors";
import "@arcgis/map-components/components/arcgis-scene";
import "@esri/calcite-components/components/calcite-alert";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-loader";
import "@esri/calcite-components/components/calcite-shell";
import "./Application.css";

export default function Application() {
  const locationLink = useRouterState({
    select: ({ location, matches }) =>
      Boolean(location.hash) && matches.some((match) => match.fullPath === panels.locations.to),
  });
  const [resources] = useState(createSceneResources);
  const [ready] = useState(() => Promise.withResolvers<SceneContextValue>());
  const [welcome, setWelcome] = useState(() => !locationLink);
  const [error, setError] = useState<string | null>(null);
  const scene = useRef<ArcgisScene>(null);

  const reportError = (cause: unknown) => {
    console.error(cause);
    setError(errorMessage(cause));
  };

  const failView = (cause: unknown) => {
    reportError(cause);
    ready.reject(cause);
  };

  useEffect(() => {
    const element = scene.current;
    if (!element) {
      return;
    }
    const handle = reactiveUtils.watch(
      () => element.fatalError,
      (cause) => {
        if (cause) {
          failView(cause);
        }
      },
      { initial: true },
    );
    return () => handle.remove();
  }, [failView]);

  return (
    <SceneContext value={ready.promise}>
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
              ready.resolve({ view: event.currentTarget.view, resources, reportError });
            }
          }}
          onarcgisViewReadyError={(event) => failView(event.detail)}
          onarcgisLoadError={(event) => reportError(event.detail)}
          aria-label="Interactive 3D globe of Mars"
        >
          <CatchBoundary
            getResetKey={() => ready.promise}
            onCatch={reportError}
            errorComponent={() => null}
          >
            <Suspense
              fallback={
                <calcite-loader
                  className="scene-loading"
                  aria-live="polite"
                  label="Loading Mars"
                  text="Loading Mars"
                />
              }
            >
              <SceneEffects welcome={welcome} />
              <SceneNavigation />
              <ToolToolbar />
            </Suspense>
          </CatchBoundary>
          <Outlet />
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
            <calcite-button
              slot="link"
              appearance="transparent"
              onClick={() => window.location.reload()}
            >
              Reload app
            </calcite-button>
          </calcite-alert>
        )}
        <LandingPage open={welcome} onStart={() => setWelcome(false)} />
        <CookieBanner />
      </calcite-shell>
    </SceneContext>
  );
}
