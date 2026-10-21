import { Suspense } from "react";
import { CatchBoundary } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import Camera from "@arcgis/core/Camera";
import { useScene } from "../application/SceneContext";
import { initialCamera } from "../application/scene";
import { errorMessage, isAbortError } from "../utilities/errors";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-notice";
import "./HomePage.css";

interface LandingPageProps {
  open: boolean;
  onStart: () => void;
}

export function LandingPage({ open, onStart }: LandingPageProps) {
  return (
    <calcite-dialog
      className="welcome-content"
      slot="dialogs"
      open={open}
      heading="Explore Mars"
      modal
      closeDisabled
      outsideCloseDisabled
      escapeDisabled
      width="s"
    >
      <h1>The red planet, closer than ever.</h1>
      <p>
        Explore Mars, its canyons, mountains and craters, and the landing sites of previous
        missions.
      </p>
      <p>
        Measure the terrain or place Earth-sized regions and 3D models on the surface to see Mars in
        perspective.
      </p>
      <p className="muted">
        Drag to explore. Use the right mouse button to tilt, the scroll wheel to zoom, or navigate
        with W, A, S, D and the arrow keys.
      </p>
      <CatchBoundary getResetKey={() => open} errorComponent={StartError}>
        <Suspense
          fallback={
            <calcite-button slot="footer-end" disabled loading>
              Start exploring
            </calcite-button>
          }
        >
          <StartExploring onStart={onStart} />
        </Suspense>
      </CatchBoundary>
    </calcite-dialog>
  );
}

function StartExploring({ onStart }: { onStart: () => void }) {
  const { view, reportError } = useScene();

  return (
    <calcite-button
      slot="footer-end"
      onClick={() => {
        onStart();
        void view
          .goTo(
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
          )
          .catch((error: unknown) => {
            if (!isAbortError(error)) {
              reportError(error);
            }
          });
      }}
    >
      Start exploring
    </calcite-button>
  );
}

function StartError({ error }: ErrorComponentProps) {
  return (
    <>
      <calcite-notice open kind="danger">
        <span slot="title">Could not load Mars</span>
        <span slot="message">{errorMessage(error)}</span>
      </calcite-notice>
      <calcite-button slot="footer-end" onClick={() => window.location.reload()}>
        Reload app
      </calcite-button>
    </>
  );
}
