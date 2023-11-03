import { Polygon, type SpatialReference } from "@arcgis/core/geometry";
import workerUrl from "./worker?worker&url";

export type UUID = ReturnType<typeof crypto.randomUUID>;
export interface WorkerSuccessResponse {
  id: UUID;
  data: Polygon;
}
export interface WorkerErrorResponse {
  id: UUID;
  error: string;
}
export type WorkerResponse =
  | (WorkerErrorResponse & { type: "error" })
  | (WorkerSuccessResponse & { type: "success" });
type WorkerRequestData =
  | {
      type: "projection";
      polygon: Polygon;
      spatialReference: SpatialReference;
    }
  | {
      type: "simplification";
      polygon: Polygon;
      tolerance?: number;
    };

export type WorkerRequest = WorkerRequestData & { id: UUID };

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class PolygonWorker {
  static readonly worker = new Worker(workerUrl, {
    type: "module",
  });

  private static readonly requests = new Map<
    UUID,
    [resolve: (p: Polygon) => void, reject: (r?: any) => void]
  >();

  static init() {
    if (PolygonWorker.worker.onmessage != null) return;

    PolygonWorker.worker.onmessage = ({
      data,
    }: MessageEvent<WorkerResponse>) => {
      const [resolve, reject] = PolygonWorker.requests.get(data.id) ?? [];
      if (data.type === "success") {
        console.log(data);
        resolve?.(new Polygon(data.data));
      } else {
        reject?.(data.error);
      }

      PolygonWorker.requests.delete(data.id);
    };
  }

  private static async request(data: WorkerRequestData) {
    const id = crypto.randomUUID();
    const promise = new Promise<Polygon>((resolve, reject) => {
      PolygonWorker.requests.set(id, [resolve, reject]);
    });

    PolygonWorker.worker.postMessage({
      id,
      ...data,
    } satisfies WorkerRequest);

    return await promise;
  }

  static async project(geometry: Polygon, spatialReference: SpatialReference) {
    const result = await PolygonWorker.request({
      type: "projection",
      polygon: geometry.toJSON(),
      spatialReference: spatialReference.toJSON(),
    });
    result.spatialReference = spatialReference;

    return result;
  }

  static async simplify(geometry: Polygon, tolerance = 25) {
    return await PolygonWorker.request({
      type: "simplification",
      polygon: geometry.toJSON(),
      tolerance,
    });
  }
}

PolygonWorker.init();
