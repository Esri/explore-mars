import Camera from "@arcgis/core/Camera";
import Viewpoint from "@arcgis/core/Viewpoint";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-home";

const homeViewpoint = new Viewpoint({
  camera: new Camera({
    position: {
      x: -57.1,
      y: -24.4,
      z: 8382276,
      spatialReference: { wkid: 104971 },
    },
    heading: 0,
    tilt: 0,
  }),
});

export function SceneNavigation() {
  return (
    <>
      <arcgis-zoom slot="top-left" referenceElement="mars-scene" />
      <arcgis-compass slot="top-left" referenceElement="mars-scene" label="Reset north" />
      <arcgis-home
        slot="top-left"
        referenceElement="mars-scene"
        viewpoint={homeViewpoint}
        label="Home view"
      />
    </>
  );
}
