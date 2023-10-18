import Graphic from "@arcgis/core/Graphic";
import type { Polygon } from "@arcgis/core/geometry";
import { Point, SpatialReference } from "@arcgis/core/geometry";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as projection from "@arcgis/core/geometry/projection";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { FillSymbol3DLayer, PolygonSymbol3D } from "@arcgis/core/symbols";
import type SceneView from "@arcgis/core/views/SceneView";
import PolygonTransform from "./PolygonTransform";

export async function graphicFromCountry(
  selectedRegion: Graphic,
  view: SceneView,
) {
  await projection.load();

  const layer = selectedRegion.layer as FeatureLayer;

  const displayField = layer.displayField;

  const query = layer.createQuery();
  query.objectIds = [selectedRegion.getObjectId()];
  query.returnGeometry = true;
  query.outFields = [displayField];
  query.outSpatialReference = SpatialReference.WebMercator;
  // query.outSpatialReference = view.spatialReference;
  // query.maxAllowableOffset = 1000;

  const result = await layer.queryFeatures(query);
  const feature = result.features[0];

  const viewCenter = new Point({
    x: view.center.x,
    y: view.center.y,
    spatialReference: view.center.spatialReference,
  });
  const viewSR = view.spatialReference;
  const spherical = new PolygonTransform(view);

  const label = feature.getAttribute(displayField);
  let geometry = feature.geometry as Polygon;
  geometry = geometryEngine.buffer(geometry, 1.887, "meters") as Polygon;
  geometry = projection.project(geometry, viewSR) as Polygon;
  geometry = spherical.moveTo(geometry, viewCenter);

  const current = spherical.scale(geometry, 1.887);

  const country = new Graphic({
    attributes: {
      label,
    },
    geometry: current,
    symbol: new PolygonSymbol3D({
      symbolLayers: [
        new FillSymbol3DLayer({
          material: {
            color: [255, 255, 255, 0.3],
          },
          outline: {
            color: [255, 255, 255, 0.8],
            size: 1,
          },
        }),
      ],
    }),
  });

  return country;
}
