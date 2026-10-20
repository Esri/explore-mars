import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-dialog";
import "./HomePage.css";

interface LandingPageProps {
  open: boolean;
  ready: boolean;
  onStart: () => void;
}

export function LandingPage({ open, ready, onStart }: LandingPageProps) {
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
      <calcite-button slot="footer-end" disabled={!ready} loading={!ready} onClick={onStart}>
        Start exploring
      </calcite-button>
    </calcite-dialog>
  );
}
