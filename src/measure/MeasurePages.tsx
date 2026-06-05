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
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import "@arcgis/map-components/components/arcgis-area-measurement-3d";
import "@arcgis/map-components/components/arcgis-direct-line-measurement-3d";
import "@arcgis/map-components/components/arcgis-elevation-profile";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { match } from "ts-pattern";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./MeasurePages.module.scss";
import { CloseButton } from "../utility-components/close-button/CloseButton";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import AppState, { Route } from "../application/AppState";

import "./esri-measurement-widget-overwrites.scss";
import Collection from "@arcgis/core/core/Collection";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Mesh from "@arcgis/core/geometry/Mesh";
import ElevationProfileLineGround from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineGround";
import ElevationProfileLineScene from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineScene";

type Page = "menu" | "area" | "line" | "elevation";

export const MeasureRoute = new Route({
  route: "measure",
  path: "menu",
  paths: ["line", "area", "elevation"],
});

@subclass("ExploreMars.page.Measure")
export class MeasurePage extends Widget {
  @property()
  page: Page = "menu";

  @property()
  mesh?: Mesh;

  groundProfile = new ElevationProfileLineGround({
    color: "green",
  });

  viewProfile = new ElevationProfileLineScene();

  elevationProfiles = new Collection<
    ElevationProfileLineGround | ElevationProfileLineScene
  >([this.groundProfile]);

  startedMeasurements = new WeakSet<object>();

  constructor() {
    super();
    const watchPage = reactiveUtils.watch(
      () => MeasureRoute.path,
      (page) => {
        if (page === "menu") {
          AppState.status = "idle";
        } else {
          AppState.status = "editing";
        }
      },
    );

    const watchModelGraphic = reactiveUtils.watch(
      () => {
        const map = AppState.view.map;

        if (map == null) {
          return undefined;
        }

        const layer = map.layers.find(
          (layer) => layer.id === "add-object",
        ) as GraphicsLayer;
        const graphic = layer?.graphics.getItemAt(0);
        return graphic?.geometry as Mesh;
      },
      async (mesh) => {
        this.mesh = mesh;

        if (mesh != null && !this.elevationProfiles.includes(this.viewProfile)) {
          this.elevationProfiles.add(this.viewProfile);
        }

        if (mesh == null && this.elevationProfiles.includes(this.viewProfile)) {
          this.elevationProfiles.remove(this.viewProfile);
        }
      },
      { initial: true },
    );

    this.addHandles([watchPage, watchModelGraphic]);
  }

  render() {
    if (MeasureRoute.path === "menu") {
      return (
        <div styles={{ display: "contents" }}>
          <MeasureMenu
            selectTool={(tool) => {
              MeasureRoute.push(tool);
            }}
          />
        </div>
      );
    }

    const tool = match(MeasureRoute.path)
      .with("area", () => (
        <arcgis-area-measurement-3d
          view={AppState.view}
          afterCreate={this.startMeasurement}
        />
      ))
      .with("elevation", () => (
        <arcgis-elevation-profile
          view={AppState.view}
          hideLegend={true}
          hideSelectButton={true}
          profiles={this.elevationProfiles}
          afterCreate={this.startMeasurement}
        />
      ))
      .with("line", () => (
        <arcgis-direct-line-measurement-3d
          view={AppState.view}
          afterCreate={this.startMeasurement}
        />
      ))
      .run();

    return (
      <div styles={{ display: "contents" }}>
        <div class={styles.measurement}>
          <CloseButton
            onClose={() => {
              this.close();
            }}
          />
          {tool}
        </div>
      </div>
    );
  }

  close() {
    MeasureRoute.reset();
    AppState.route.back();
  }

  private startMeasurement = (element: any) => {
    if (this.startedMeasurements.has(element)) {
      return;
    }

    this.startedMeasurements.add(element);
    void element.componentOnReady().then(() => element.start());
  };
}

interface MeasureMenuProps {
  selectTool: (tool: Exclude<Page, "menu">) => void;
}
function MeasureMenu({ selectTool }: MeasureMenuProps) {
  return (
    <SubMenu
      items={[
        <Item
          text="Line"
          itemClass={styles.line}
          onClick={() => {
            selectTool("line");
          }}
        />,
        <Item
          text="Area"
          itemClass={styles.area}
          onClick={() => {
            selectTool("area");
          }}
        />,
        <Item
          text="Elevation"
          itemClass={styles.elevation}
          onClick={() => {
            selectTool("elevation");
          }}
        />,
      ]}
    />
  );
}

