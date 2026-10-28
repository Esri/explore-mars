import Polygon, { type PolygonProperties } from "@arcgis/core/geometry/Polygon";
import type SpatialReference from "@arcgis/core/geometry/SpatialReference";
import type { SpatialReferenceProperties } from "@arcgis/core/geometry/SpatialReference";

export type RegionWorkerRequest =
  | {
      type: "prepare";
      polygon: PolygonProperties;
      spatialReference: SpatialReferenceProperties;
    }
  | { type: "preview"; polygon: PolygonProperties };

export type RegionWorkerResponse =
  | { type: "success"; polygon: PolygonProperties; preview: PolygonProperties }
  | { type: "error"; message: string };

async function processRegion(request: RegionWorkerRequest, signal: AbortSignal) {
  signal.throwIfAborted();
  const worker = new Worker(new URL("./region.worker.ts", import.meta.url), { type: "module" });
  const { promise, resolve, reject } =
    Promise.withResolvers<Extract<RegionWorkerResponse, { type: "success" }>>();
  const abort = () => reject(signal.reason);
  try {
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<RegionWorkerResponse>) => {
      if (event.data.type === "error") {
        reject(new Error(event.data.message));
      } else {
        resolve(event.data);
      }
    };
    worker.onerror = (event) => reject(new Error(event.message || "Region worker failed."));
    worker.onmessageerror = () => reject(new Error("Could not read the prepared region."));
    worker.postMessage(request);
    const result = await promise;
    signal.throwIfAborted();
    return { polygon: new Polygon(result.polygon), preview: new Polygon(result.preview) };
  } finally {
    signal.removeEventListener("abort", abort);
    worker.terminate();
  }
}

export function prepareRegion(
  polygon: Polygon,
  spatialReference: SpatialReference,
  signal: AbortSignal,
) {
  return processRegion(
    {
      type: "prepare",
      polygon: polygon.toJSON(),
      spatialReference: spatialReference.toJSON(),
    },
    signal,
  );
}

export async function createRegionPreview(polygon: Polygon, signal: AbortSignal) {
  const result = await processRegion({ type: "preview", polygon: polygon.toJSON() }, signal);
  return result.preview;
}
