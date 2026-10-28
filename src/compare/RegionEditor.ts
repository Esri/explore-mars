import type Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import type SceneView from "@arcgis/core/views/SceneView";
import type { UpdateEvent } from "@arcgis/core/widgets/Sketch/types";
import type { mat4 } from "gl-matrix";
import PolygonTransform from "./PolygonTransform";

type EditingRegion = {
  country: Graphic;
  center: Graphic;
  polygon: Polygon;
  preview: Polygon;
  anchor: Point;
  position: Point;
  matrix?: mat4;
  before?: { polygon: Polygon; preview: Polygon; position: Point };
};

export default class RegionEditor {
  private transform: PolygonTransform;
  private region: EditingRegion | null = null;

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
  }

  update(event: UpdateEvent) {
    const region = this.region;
    if (!region) {
      return;
    }
    if (event.aborted) {
      this.cancel(region);
      return;
    }
    if (event.state === "start") {
      this.commit(region);
      region.before = {
        polygon: region.polygon,
        preview: region.preview,
        position: region.position.clone(),
      };
      return;
    }
    if (event.state === "complete") {
      this.commit(region);
      region.before = undefined;
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

  private cancel(region: EditingRegion) {
    if (region.before) {
      region.polygon = region.before.polygon;
      region.preview = region.before.preview;
      region.position = region.before.position.clone();
      region.anchor = region.position.clone();
    }
    region.matrix = undefined;
    region.before = undefined;
    region.country.geometry = region.polygon;
    region.center.geometry = region.position.clone();
  }
}
