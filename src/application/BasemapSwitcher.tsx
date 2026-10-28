import { marsImageryBasemap, shadedReliefBasemap } from "../utilities/layers";
import { useScene } from "./SceneContext";
import "@arcgis/map-components/components/arcgis-basemap-toggle";

export function BasemapSwitcher() {
  const { view } = useScene();

  return (
    <arcgis-basemap-toggle
      slot="bottom-right"
      referenceElement="mars-scene"
      nextBasemap={
        view.map?.basemap === marsImageryBasemap ? shadedReliefBasemap : marsImageryBasemap
      }
    />
  );
}
