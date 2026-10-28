/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import * as centroidOperator from "@arcgis/core/geometry/operators/centroidOperator";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import PolygonSymbol3D from "@arcgis/core/symbols/PolygonSymbol3D";
import type SceneView from "@arcgis/core/views/SceneView";
import PolygonTransform from "./PolygonTransform";
import { prepareRegion } from "./regionWorker";

export async function graphicFromCountry(
  selectedRegion: Graphic,
  view: SceneView,
  signal: AbortSignal,
) {
  const layer = selectedRegion.layer;
  if (!(layer instanceof FeatureLayer)) {
    throw new Error("Select a country from a feature layer.");
  }

  const objectId = selectedRegion.getObjectId();
  if (objectId == null) {
    throw new Error("The selected region is missing its object ID.");
  }

  const query = layer.createQuery();
  query.objectIds = [objectId];
  query.returnGeometry = true;
  query.outFields = [];
  query.outSpatialReference = SpatialReference.WebMercator;

  const result = await layer.queryFeatures(query, { signal });
  const feature = result.features[0];
  if (!(feature?.geometry instanceof Polygon)) {
    throw new Error("The selected region does not have a polygon footprint.");
  }

  const viewCenter = new Point({
    x: view.center.x,
    y: view.center.y,
    spatialReference: view.center.spatialReference,
  });
  const viewSR = view.spatialReference;
  const spherical = new PolygonTransform(view);

  const { polygon, preview } = await prepareRegion(feature.geometry, viewSR, signal);
  const anchor = centroidOperator.execute(polygon);
  const move = spherical.moveMatrix(anchor, viewCenter);
  const geometry = spherical.transform(polygon, move, anchor);
  const movedPreview = spherical.transform(preview, move, anchor);
  const center = centroidOperator.execute(geometry);
  const current = spherical.scale(geometry, 1.887, center);

  const country = new Graphic({
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

  return { country, preview: spherical.scale(movedPreview, 1.887, center) };
}
