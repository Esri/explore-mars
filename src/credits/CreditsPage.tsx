import { PanelSection } from "../utility-components/PanelSection";

export function CreditsPage() {
  return (
    <>
      <p className="instructions">
        Built with{" "}
        <a href="https://developers.arcgis.com/javascript/">ArcGIS Maps SDK for JavaScript</a>,{" "}
        <a href="https://developers.arcgis.com/calcite-design-system/">Calcite Design System</a> and
        React.
      </p>
      <PanelSection>
        <h3>Data credits</h3>
        <p className="muted">
          NASA, ESA, HRSC, Goddard Space Flight Center, USGS Astrogeology Science Center, Esri and
          JPL.
        </p>
      </PanelSection>
    </>
  );
}
