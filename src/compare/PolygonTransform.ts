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
import type { Point, SpatialReference } from "@arcgis/core/geometry";
import { Polygon } from "@arcgis/core/geometry";
import type SceneView from "@arcgis/core/views/SceneView";
import { mat4, vec3, type vec4 } from "gl-matrix";
import * as webgl from "@arcgis/core/views/3d/webgl.js";

const MAX_LON = 180;

/*
 * Render space transformations
 */

export default class PolygonTransform {
  constructor(public view: SceneView) {}

  public rotate(polygon: Polygon, angle: number) {
    const rot = vec3.create();

    webgl.toRenderCoordinates(
      this.view,
      [polygon.centroid.x, polygon.centroid.y, 0],
      0,
      polygon.spatialReference,
      rot,
      0,
      1,
    );

    const mat = mat4.create();
    mat4.rotate(mat, mat, angle, rot);
    return this.transformPolygon(polygon, mat);
  }

  public moveTo(polygon: Polygon, point: Point) {
    const centroid = polygon.centroid;
    const mat = mat4.create();

    this.addZRotation(point, mat, false);
    this.addYRotation(point, mat, false);

    this.addYRotation(centroid, mat, true);
    this.addZRotation(centroid, mat, true);

    return this.transformPolygon(polygon, mat);
  }

  public scale(polygon: Polygon, factor: number) {
    const cx = polygon.centroid.x;
    const cy = polygon.centroid.y;

    const result = polygon.clone();

    result.rings.forEach((ring) => {
      ring.forEach((v) => {
        v[0] += (v[0] - cx) * (factor - 1);
        v[1] += (v[1] - cy) * (factor - 1);
      });
    });

    return result;
  }

  private clamp(v: number, min: number, max: number) {
    if (v < min) {
      return min;
    }

    if (v > max) {
      return max;
    }

    return v;
  }

  private angle(vector: vec3, other: vec3) {
    const cosAngle =
      vec3.dot(vector, other) / (vec3.length(vector) * vec3.length(other));
    return -Math.acos(this.clamp(cosAngle, -1, 1));
    // return -acosClamped(cosAngle);
  }

  private axisAngleFromPoints(
    fromPoint: vec3,
    toPoint: vec3,
    outAxisAngle = [0, 0, 1, 0] as vec4,
  ) {
    vec3.cross(outAxisAngle as vec3, fromPoint, toPoint);
    vec3.normalize(outAxisAngle as vec3, outAxisAngle as vec3);

    outAxisAngle[3] = this.angle(fromPoint, toPoint);

    return outAxisAngle;
  }

  private transformCoordinates(
    x: number,
    y: number,
    spatialReference: SpatialReference,
    mat: mat4,
  ) {
    const newCoord = vec3.fromValues(0, 0, 0);

    webgl.toRenderCoordinates(
      this.view,
      [x, y, 0],
      0,
      spatialReference,
      newCoord,
      0,
      1,
    );

    vec3.transformMat4(newCoord, newCoord, mat);
    const newCoordSR = [0, 0, 0];
    webgl.fromRenderCoordinates(
      this.view,
      newCoord,
      0,
      newCoordSR,
      0,
      spatialReference,
      1,
    );

    return [newCoordSR[0], newCoordSR[1]];
  }

  private transformPolygon(polygon: Polygon, mat: mat4) {
    const rings = [];

    const sr = polygon.spatialReference;

    const [cLon] = this.transformCoordinates(
      polygon.centroid.x,
      polygon.centroid.y,
      sr,
      mat,
    );

    // const result = polygon.clone();

    for (const ring of polygon.rings) {
      const newCoords = [];
      for (const coord of ring) {
        let [lon, lat] = this.transformCoordinates(coord[0], coord[1], sr, mat);

        const angle = lon - cLon;
        if (MAX_LON < Math.abs(angle)) {
          lon = cLon < 0 ? lon - 2 * MAX_LON : lon + 2 * MAX_LON;
        }

        newCoords.push([lon, lat]);
      }
      rings.push(newCoords);
    }

    return new Polygon({
      rings,
      spatialReference: sr,
    });
  }

  private addZRotation(point: Point, mat: mat4, invert: boolean) {
    const nullCoords = vec3.create();
    const currentCoords = vec3.create();

    webgl.toRenderCoordinates(
      this.view,
      [0, 0, 0],
      0,
      point.spatialReference,
      nullCoords,
      0,
      1,
    );

    webgl.toRenderCoordinates(
      this.view,
      [point.x, 0, 0],
      0,
      point.spatialReference,
      currentCoords,
      0,
      1,
    );

    const rot = this.axisAngleFromPoints(nullCoords, currentCoords);

    if (isNaN(rot[3])) {
      return;
    }

    mat4.rotate(mat, mat, invert ? rot[3] : -rot[3], rot as vec3);
  }

  private addYRotation(point: Point, mat: mat4, invert: boolean) {
    const nullCoords = vec3.create();
    const currentCoords = vec3.create();

    webgl.toRenderCoordinates(
      this.view,
      [0, 0, 0],
      0,
      point.spatialReference,
      nullCoords,
      0,
      1,
    );

    webgl.toRenderCoordinates(
      this.view,
      [0, point.y, 0],
      0,
      point.spatialReference,
      currentCoords,
      0,
      1,
    );

    const rot = this.axisAngleFromPoints(nullCoords, currentCoords);

    if (isNaN(rot[3])) {
      return;
    }

    mat4.rotate(mat, mat, invert ? rot[3] : -rot[3], rot as vec3);
  }
}
