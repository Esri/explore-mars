import Polygon from "@arcgis/core/geometry/Polygon";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import { bufferExecute } from "@arcgis/core/geometry/operators/bufferOperator";
import { generalizeExecute } from "@arcgis/core/geometry/operators/generalizeOperator";
import { projectExecute, projectLoad } from "@arcgis/core/geometry/operators/projectOperator";
import type { RegionWorkerRequest, RegionWorkerResponse } from "./regionWorker";

const projectionReady = projectLoad();

self.onmessage = async (event: MessageEvent<RegionWorkerRequest>) => {
  let response: RegionWorkerResponse;

  try {
    await projectionReady;
    const request = event.data;
    let polygon = new Polygon(request.polygon);
    if (request.type === "prepare") {
      const buffered = bufferExecute(polygon, 1.887, { unit: "meters" });

      if (!(buffered instanceof Polygon)) {
        throw new Error("Could not prepare the region footprint.");
      }

      const projected = projectExecute(buffered, new SpatialReference(request.spatialReference));

      if (!(projected instanceof Polygon)) {
        throw new Error("Could not project the selected region onto Mars.");
      }

      polygon = projected;
    }

    const extent = polygon.extent;

    if (!extent) {
      throw new Error("The region footprint is empty.");
    }

    const tolerance = Math.min(Math.max(extent.width, extent.height) / 1000, 0.01);
    const preview = generalizeExecute(polygon, tolerance, {
      removeDegenerateParts: false,
    });

    if (!(preview instanceof Polygon)) {
      throw new Error("Could not simplify the region footprint.");
    }

    response = {
      type: "success",
      polygon: polygon.toJSON(),
      preview: preview.toJSON(),
    };
  } catch (cause) {
    response = {
      type: "error",
      message: cause instanceof Error ? cause.message : String(cause),
    };
  }

  self.postMessage(response);
};
