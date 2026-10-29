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
  position: Point;
};

type EditingRegion = {
  country: Graphic;
  center: Graphic;
  polygon: Polygon;
  preview: Polygon;
  anchor: Point;
  position: Point;
  matrix?: mat4;
  before?: RegionSnapshot;
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

  setRegion(country: Graphic, center: Graphic, preview: Polygon) {
    if (!(country.geometry instanceof Polygon) || !(center.geometry instanceof Point)) {
      throw new Error("The region is missing its footprint or editing handle.");
    }
    this.clear();
    this.region = {
      country,
      center,
      polygon: country.geometry,
      preview,
      anchor: center.geometry.clone(),
      position: center.geometry.clone(),
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
      region.before = this.snapshot(region);
      this.history = [region.before];
      this.historyIndex = 0;
      return;
    }
    if (event.state === "complete") {
      this.commit(region);
      region.before = undefined;
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
      region.matrix = this.transform.rotationMatrix(region.anchor, (info.angle * Math.PI) / 180);
    } else if (info.type === "move" || info.type === "move-start" || info.type === "move-stop") {
      if (!(region.center.geometry instanceof Point)) {
        throw new Error("The region editing handle has no position.");
      }
      const target = region.center.geometry.clone();
      region.matrix = this.transform.moveMatrix(region.anchor, target);
      region.position = target;
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
        region.matrix,
        region.anchor,
      );
    }
  }

  private commit(region: EditingRegion) {
    if (region.matrix) {
      region.polygon = this.transform.transform(region.polygon, region.matrix, region.anchor);
      region.preview = this.transform.transform(region.preview, region.matrix, region.anchor);
      region.anchor = region.position.clone();
      region.matrix = undefined;
    }
    region.country.geometry = region.polygon;
  }

  private snapshot(region: EditingRegion): RegionSnapshot {
    return {
      polygon: region.polygon,
      preview: region.preview,
      position: region.position.clone(),
    };
  }

  private restore(region: EditingRegion, snapshot: RegionSnapshot) {
    region.polygon = snapshot.polygon;
    region.preview = snapshot.preview;
    region.position = snapshot.position.clone();
    region.anchor = region.position.clone();
    region.matrix = undefined;
    region.country.geometry = region.polygon;
    region.center.geometry = region.position.clone();
  }

  private cancel(region: EditingRegion) {
    if (region.before) {
      this.restore(region, region.before);
    }
    region.matrix = undefined;
    region.before = undefined;
    region.country.geometry = region.polygon;
    region.center.geometry = region.position.clone();
    this.history = [];
    this.historyIndex = 0;
  }
}
