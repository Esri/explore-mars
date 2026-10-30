import { useScene } from "../application/SceneContext";
import "@arcgis/map-components/components/arcgis-direct-line-measurement-3d";

export function LineMeasurementPage() {
  const { reportError } = useScene();

  return (
    <arcgis-direct-line-measurement-3d
      referenceElement="mars-scene"
      onarcgisReady={(event) => {
        void event.currentTarget.start().catch(reportError);
      }}
    />
  );
}
