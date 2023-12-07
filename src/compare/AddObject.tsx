import Graphic from "@arcgis/core/Graphic";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { PointSymbol3D, ObjectSymbol3DLayer } from "@arcgis/core/symbols";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import AppState from "../application/AppState";
import { EditingInfo } from "./ComparePage";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./AddObject.module.scss";
import zurich from "./gltf/zurich/scene.gltf";
import manhattan from "./gltf/manhattan/scene.gltf";
import killimanjaro from "./gltf/killimanjaro/scene.gltf";
import grandCanyon from "./gltf/grand-canyon/scene.gltf";
import dubai from "./gltf/dubai/scene.gltf";
import everest from "./gltf/everest/scene.gltf";

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

@subclass("ExploreMars.page.AddObjectPage")
export class AddObjectPage extends Widget {
  @property()
  sketchViewModel!: SketchViewModel;

  @property()
  viewGraphics!: GraphicsLayer;

  @property()
  placedObject: Graphic | null = null;

  start() {
    if (this.viewGraphics != null) return;

    const view = AppState.view;

    const graphics = new GraphicsLayer({
      title: "SVM layer for comparison",
      listMode: "hide",
    });

    view.map.layers.add(graphics);

    const sketchViewModel = new SketchViewModel({
      layer: graphics,
      view,
      defaultUpdateOptions: {
        toggleToolOnClick: false,
        enableScaling: false,
        enableZ: true,
      },
    });

    sketchViewModel.on("delete", () => {
      this.destroy();
    });

    this.viewGraphics = graphics;
    this.sketchViewModel = sketchViewModel;
  }

  render() {
    console.log("rendering....");
    if (this.placedObject != null) {
      return <EditingInfo />;
    }

    const items = objects.map((o) => (
      <Object
        gltf={o}
        onClick={(el) => {
          void AppState.load(this.addGltf(el.gltf));
        }}
      />
    ));
    return <SubMenu class={styles.container} items={items} />;
  }

  private async addGltf(url: string) {
    // const href = await importModel(url);

    const gltfModel = new ObjectSymbol3DLayer({
      anchor: "bottom",
      resource: {
        href: url,
      },
    });
    const view = AppState.view;
    const geometry = view.center.clone();
    geometry.z = 0;
    const graphic = new Graphic({
      geometry,
      symbol: new PointSymbol3D({
        symbolLayers: [gltfModel],
      }),
    });

    this.placedObject = graphic;

    this.viewGraphics.add(graphic);

    void AppState.view.goTo({
      target: graphic.geometry,
      scale: 250_000,
      tilt: 70,
    });

    void this.sketchViewModel.update(graphic, {
      enableScaling: false,
    });
  }

  clear() {
    this.viewGraphics?.removeAll();
    this.placedObject?.destroy();
    this.placedObject = null;
  }

  destroy(): void {
    this.sketchViewModel.cancel();
    this.viewGraphics.graphics.forEach((graphic) => {
      graphic.destroy();
    });
    this.viewGraphics.removeAll();
    this.placedObject = null;

    if (!this.sketchViewModel.destroyed) this.sketchViewModel.destroy();
    this.viewGraphics.destroy();

    super.destroy();
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
