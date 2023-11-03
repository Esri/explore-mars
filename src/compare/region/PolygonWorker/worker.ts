import { type SpatialReference, Polygon } from "@arcgis/core/geometry";
import * as projection from "@arcgis/core/geometry/projection";
import { match } from "ts-pattern";
import simplify from "simplify-js";
import {
  type UUID,
  type WorkerSuccessResponse,
  type WorkerRequest,
  type WorkerResponse,
} from "./PolygonWorker";

async function project(polygon: Polygon, spatialReference: SpatialReference) {
  await projection.load();
  const projected = projection.project(polygon, spatialReference) as Polygon;
  return projected;
}

function toSimplified(polygon: Polygon, tolerance = 25) {
  const geometry = new Polygon(polygon);
  // The further the country is in the north / south, the more we have to simplify
  const ymax = Math.max(
    Math.abs(geometry.extent.ymax),
    Math.abs(geometry.extent.ymin),
  );
  const calculatedTolerance = ymax / tolerance;

  let rings = geometry.rings;
  const maxLength = rings.reduce((acc, cur) => Math.max(cur.length, acc), 0);

  // Filter small islands around main land
  rings = rings.filter((r) => r.length > maxLength / 10);

  // Simplify remaining rings
  rings = rings.map((ring) => {
    const points = ring.map((c) => {
      return { x: c[0], y: c[1] };
    });
    const simplified = simplify(points, calculatedTolerance);
    return simplified.map((p) => [p.x, p.y]);
  });

  geometry.rings = rings;
  return geometry;
}

function resolve(
  id: UUID,
  data: WorkerSuccessResponse["data"],
): WorkerResponse {
  return {
    type: "success",
    id,
    data: data.toJSON(),
  };
}

function reject(id: UUID, message: string): WorkerResponse {
  return {
    type: "error",
    id,
    error: message,
  };
}

self.onmessage = async (message: MessageEvent<WorkerRequest>) => {
  const id = message.data.id;
  const data = message.data;

  try {
    const result = await match(data)
      .with(
        { type: "projection" },
        async ({ polygon, spatialReference }) =>
          await project(polygon, spatialReference),
      )
      .with({ type: "simplification" }, ({ polygon, tolerance = 25 }) =>
        toSimplified(polygon, tolerance),
      )
      .exhaustive();

    self.postMessage(resolve(id, result));
  } catch (error) {
    let errorMessage = "unknown error";
    if (
      error != null &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      errorMessage = error.message;
    }
    console.log({ errorMessage });
    self.postMessage(reject(id, errorMessage));
  }
};
