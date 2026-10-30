import { useScene } from "../application/SceneContext";
import "@arcgis/map-components/components/arcgis-area-measurement-3d";

export function AreaMeasurementPage() {
  const { reportError } = useScene();

  return (
    <arcgis-area-measurement-3d
      referenceElement="mars-scene"
      onarcgisReady={(event) => {
        void event.currentTarget.start().catch(reportError);
      }}
    />
  );
}
