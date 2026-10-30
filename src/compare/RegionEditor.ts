import type Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import type SceneView from "@arcgis/core/views/SceneView";
import type { RedoEvent, UndoEvent, UpdateEvent } from "@arcgis/core/widgets/Sketch/types";
import type { mat4 } from "gl-matrix";
import PolygonTransform from "./PolygonTransform";

type RegionSnapshot = {
  polygon: Polygon;
  preview: Polygon;
  handlePosition: Point;
};

type EditingRegion = {
  country: Graphic;
  handle: Graphic;
  // Commit full-resolution polygons; render simplified previews during gestures.
  polygon: Polygon;
  preview: Polygon;
  transformOrigin: Point;
  handlePosition: Point;
  pendingTransform?: mat4;
  sessionSnapshot?: RegionSnapshot;
};

export default class RegionEditor {
  private transform: PolygonTransform;
  private region: EditingRegion | null = null;
  private history: RegionSnapshot[] = [];
  private historyIndex = 0;

  constructor(view: SceneView) {
    this.transform = new PolygonTransform(view);
  }

  get country() {
    return this.region?.country;
  }

  setRegion(country: Graphic, handle: Graphic, preview: Polygon) {
    if (!(country.geometry instanceof Polygon) || !(handle.geometry instanceof Point)) {
      throw new Error("The region is missing its footprint or editing handle.");
    }
    this.clear();
    this.region = {
      country,
      handle,
      polygon: country.geometry,
      preview,
      transformOrigin: handle.geometry.clone(),
      handlePosition: handle.geometry.clone(),
    };
  }

  clear() {
    this.region = null;
    this.history = [];
    this.historyIndex = 0;
  }

  update(event: UpdateEvent | UndoEvent | RedoEvent) {
    const region = this.region;
    if (!region) {
      return;
    }
    if (event.type === "undo" || event.type === "redo") {
      const index = this.historyIndex + (event.type === "undo" ? -1 : 1);
      const snapshot = this.history[index];
      if (snapshot) {
        this.restore(region, snapshot);
        this.historyIndex = index;
      }
      return;
    }
    if (event.aborted) {
      this.cancel(region);
      return;
    }
    if (event.state === "start") {
      this.commit(region);
      region.sessionSnapshot = this.snapshot(region);
      this.history = [region.sessionSnapshot];
      this.historyIndex = 0;
      return;
    }
    if (event.state === "complete") {
      this.commit(region);
      region.sessionSnapshot = undefined;
      this.history = [];
      this.historyIndex = 0;
      return;
    }
    const info = event.toolEventInfo;
    if (!info) {
      return;
    }

    if (info.type === "move-start" || info.type === "rotate-start") {
      this.commit(region);
    }
    if (info.type === "rotate" || info.type === "rotate-start" || info.type === "rotate-stop") {
      region.pendingTransform = this.transform.rotationMatrix(
        region.transformOrigin,
        (info.angle * Math.PI) / 180,
      );
    } else if (info.type === "move" || info.type === "move-start" || info.type === "move-stop") {
      if (!(region.handle.geometry instanceof Point)) {
        throw new Error("The region editing handle has no position.");
      }
      const target = region.handle.geometry.clone();
      region.pendingTransform = this.transform.moveMatrix(region.transformOrigin, target);
      region.handlePosition = target;
    } else {
      return;
    }

    if (info.type === "move-stop" || info.type === "rotate-stop") {
      this.commit(region);
      this.history.splice(this.historyIndex + 1);
      this.history.push(this.snapshot(region));
      this.historyIndex += 1;
    } else {
      region.country.geometry = this.transform.transform(
        region.preview,
        region.pendingTransform,
        region.transformOrigin,
      );
    }
  }

  private commit(region: EditingRegion) {
    if (region.pendingTransform) {
      region.polygon = this.transform.transform(
        region.polygon,
        region.pendingTransform,
        region.transformOrigin,
      );
      region.preview = this.transform.transform(
        region.preview,
        region.pendingTransform,
        region.transformOrigin,
      );
      region.transformOrigin = region.handlePosition.clone();
      region.pendingTransform = undefined;
    }
    region.country.geometry = region.polygon;
  }

  private snapshot(region: EditingRegion): RegionSnapshot {
    return {
      polygon: region.polygon,
      preview: region.preview,
      handlePosition: region.handlePosition.clone(),
    };
  }

  private restore(region: EditingRegion, snapshot: RegionSnapshot) {
    region.polygon = snapshot.polygon;
    region.preview = snapshot.preview;
    region.handlePosition = snapshot.handlePosition.clone();
    region.transformOrigin = region.handlePosition.clone();
    region.pendingTransform = undefined;
    region.country.geometry = region.polygon;
    region.handle.geometry = region.handlePosition.clone();
  }

  private cancel(region: EditingRegion) {
    if (region.sessionSnapshot) {
      this.restore(region, region.sessionSnapshot);
    }
    region.pendingTransform = undefined;
    region.sessionSnapshot = undefined;
    region.country.geometry = region.polygon;
    region.handle.geometry = region.handlePosition.clone();
    this.history = [];
    this.historyIndex = 0;
  }
}
