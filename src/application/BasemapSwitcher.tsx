import { useScene } from "./SceneContext";
import "@arcgis/map-components/components/arcgis-basemap-toggle";

export function BasemapSwitcher() {
  const { view, resources } = useScene();

  return (
    <arcgis-basemap-toggle
      slot="bottom-right"
      referenceElement="mars-scene"
      nextBasemap={
        view.map?.basemap === resources.imageryBasemap
          ? resources.reliefBasemap
          : resources.imageryBasemap
      }
    />
  );
}
