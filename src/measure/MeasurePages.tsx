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
import AreaMeasurement3D from "@arcgis/core/widgets/AreaMeasurement3D";
import DirectLineMeasurement3D from "@arcgis/core/widgets/DirectLineMeasurement3D";
import ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { match } from "ts-pattern";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./MeasurePages.module.scss";
import { CloseButton } from "../utility-components/close-button/CloseButton";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import AppState, { Route } from "../application/AppState";

import "./esri-measurement-widget-overwrites.scss";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { Mesh } from "@arcgis/core/geometry";
import ElevationProfileLineGround from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineGround";
import ElevationProfileLineView from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineView";

type Page = "menu" | "area" | "line" | "elevation";

export const MeasureRoute = new Route({
  route: "measure",
  path: "menu",
  paths: ["line", "area", "elevation"],
});

const groundProfile = new ElevationProfileLineGround({
  color: 'green'
})

const viewProfile = new ElevationProfileLineView();

@subclass("ExploreMars.page.Measure")
export class MeasurePage extends Widget {
  @property()
  page: Page = "menu";

  @property()
  mesh?: Mesh;

  groundProfile = new ElevationProfileLineGround({
    color: 'green'
  })

  viewProfile = new ElevationProfileLineView();

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
        const layer = AppState.view.map.layers.find(
          (layer) => layer.id === "add-object",
        ) as GraphicsLayer;
        const graphic = layer?.graphics.getItemAt(0);
        return graphic?.geometry as Mesh;
      },
      async (mesh) => {
        this.mesh = mesh;
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

    const profiles: Array<ElevationProfileLineGround | ElevationProfileLineView> = [this.groundProfile];

    if (this.mesh) {
      profiles.push(this.viewProfile);
    }

    const tool = match(MeasureRoute.path)
      .with("area", () => (
        <AreaMeasurement3D
          //@ts-ignore
          afterCreate={(node) => {
            node.viewModel.start();
          }}
          view={AppState.view}
        />
      ))
      .with("elevation", () => (
        <ElevationProfile
          //@ts-ignore
          afterCreate={(node) => {
            node.viewModel.start();
          }}
          view={AppState.view}
          profiles={profiles}
          visibleElements={{
            legend: false,
            selectButton: false,
            sketchButton: true
          }}
        />
      ))
      .with("line", () => (
        <DirectLineMeasurement3D
          //@ts-ignore
          afterCreate={(node) => {
            node.viewModel.start();
          }}
          view={AppState.view}
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

