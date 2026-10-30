import { Suspense } from "react";
import { CatchBoundary } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import Camera from "@arcgis/core/Camera";
import { useScene } from "../application/SceneContext";
import { initialCamera } from "../application/scene";
import { errorMessage } from "../utilities/errors";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-notice";
import "./HomePage.css";

interface HomePageProps {
  open: boolean;
  onStart: () => void;
}

export function HomePage({ open, onStart }: HomePageProps) {
  return (
    <calcite-dialog
      className="welcome-content"
      slot="dialogs"
      open={open}
      heading="Explore Mars!"
      modal
      closeDisabled
      outsideCloseDisabled
      escapeDisabled
      width="s"
    >
      <p>
        Have you always dreamt of being an astronaut? Come close by exploring Mars, its canyons,
        mountains and craters along with the location of previous missions!
      </p>
      <p className="muted">
        Tip: to navigate use the left and right mouse buttons, or with your keyboard using W,A,S,D +
        arrow keys.
      </p>
      <CatchBoundary getResetKey={() => open} errorComponent={StartError}>
        <Suspense
          fallback={
            <calcite-button slot="footer-end" disabled loading>
              Start now!
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
          .catch(reportError);
      }}
    >
      Start now!
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
