import { PanelSection } from "../utility-components/PanelSection";

export function CreditsPage() {
  return (
    <>
      <p>
        <strong>Explore Mars in 3D!</strong>
      </p>
      <p>
        Various imagery layers and detailed terrain allow you to explore the planet's surface. Place
        Earth-sized regions and 3D models to better understand distances and elevation on Mars.
      </p>
      <p>
        The app was built using the{" "}
        <a href="https://js.arcgis.com">ArcGIS Maps SDK for JavaScript</a>.
      </p>
      <PanelSection>
        <p className="muted">
          NASA, ESA, HRSC, Goddard Space Flight Center | USGS Astrogeology Science Center, Esri, JPL
          | Wikipedia
        </p>
      </PanelSection>
    </>
  );
}
