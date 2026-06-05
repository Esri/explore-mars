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
import Graphic from "@arcgis/core/Graphic";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import {
  PointSymbol3D,
  ObjectSymbol3DLayer,
  MeshSymbol3D,
  FillSymbol3DLayer,
} from "@arcgis/core/symbols";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import { importModel } from "./GlTFImporter";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import AppState from "../application/AppState";
import { EditingInfo, compareRoute } from "./ComparePage";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./AddObject.module.scss";
import zurich from "./gltf/zurich.zip";
import manhattan from "./gltf/manhattan.zip";
import killimanjaro from "./gltf/killimanjaro.zip";
import grandCanyon from "./gltf/grand-canyon.zip";
import dubai from "./gltf/dubai.zip";
import everest from "./gltf/everest.zip";
import Mesh from "@arcgis/core/geometry/Mesh";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

interface GltfObject {
  id: string;
  name: string;
  gltf: string;
}

const objects: GltfObject[] = [
  {
    id: "zurich",
    gltf: zurich,
    name: "Zurich",
  },
  {
    id: "manhattan",
    gltf: manhattan,
    name: "Manhattan",
  },
  {
    id: "killimanjaro",
    gltf: killimanjaro,
    name: "Killimanjaro",
  },
  {
    id: "grand-canyon",
    gltf: grandCanyon,
    name: "Grand Canyon",
  },
  {
    id: "dubai",
    gltf: dubai,
    name: "Dubai",
  },
  {
    id: "everest",
    gltf: everest,
    name: "Everest",
  },
];

const graphics = new GraphicsLayer({
  id: "add-object",
  title: "SVM layer for comparison",
  listMode: "hide",
  elevationInfo: {
    mode: 'relative-to-ground',
  },
});

@subclass("ExploreMars.page.AddObjectPage")
export class AddObjectPage extends Widget {
  @property()
  sketchViewModel = new SketchViewModel({
    view: AppState.view,
    layer: graphics,
    defaultUpdateOptions: {
      toggleToolOnClick: false,
      enableScaling: false,
      enableZ: true,
    },
  });

  @property()
  state: "selecting" | "editing" = "selecting";

  postInitialize() {
    const view = AppState.view;

    view.map.add(graphics);
    this.sketchViewModel.on("delete", () => {
      graphics.removeAll();

      if (
        AppState.route.match(compareRoute) &&
        compareRoute.path === "models"
      ) {
        compareRoute.back();
      }
    });
  }

  render() {
    const items = objects.map((o) => (
      <Object
        gltf={o}
        onClick={(el) => {
          graphics.removeAll();
          void AppState.load(this.addGltf(el.gltf));
        }}
      />
    ));

    return (
      <div style="display:contents">
        {AppState.route.match(compareRoute, "editing") ? (
          <EditingInfo />
        ) : (
          <SubMenu class={styles.container} items={items} />
        )}
      </div>
    );
  }

  private async addGltf(url: string) {
    const href = await importModel(url);

    const view = AppState.view;

    const center = view.center.clone();
    center.z = 0;

    const mesh = await Mesh.createFromGLTF(center, href);


    const graphic = new Graphic({
      geometry: mesh,
      symbol: new MeshSymbol3D({
        symbolLayers: [new FillSymbol3DLayer()],
      }),
    });

    graphics.add(graphic);

    compareRoute.state = "editing";

    void AppState.view.goTo({
      target: graphic,
      scale: 250_000,
      tilt: 70,
    });
    void this.sketchViewModel.update(graphic, {
      enableScaling: false,
    });
  }
}

interface ObjectProps {
  gltf: GltfObject;
  onClick: (gltf: GltfObject) => void;
}
function Object({ gltf, onClick }: ObjectProps) {
  return (
    <Item
      itemClass={styles[gltf.id]}
      onClick={() => {
        onClick(gltf);
      }}
      text={gltf.name}
    />
  );
}
