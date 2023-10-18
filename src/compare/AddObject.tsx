import Graphic from "@arcgis/core/Graphic";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { createEnterCssTransition } from "maquette-css-transitions";
import { PointSymbol3D, ObjectSymbol3DLayer } from "@arcgis/core/symbols";
import type SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import GlTFImporter from "./GlTFImporter";
import type SceneView from "@arcgis/core/views/SceneView";

const CSS = {
  closeButton: "close-button",
  submenuItem: "submenu-item",
  pageContainer: "page-container",
};

interface GltfEl {
  name: string;
  gltf: string;
}

const objects: GltfEl[] = [
  {
    gltf: "gltf/zurich.zip",
    name: "Zurich",
  },
  {
    gltf: "gltf/manhattan.zip",
    name: "Manhattan",
  },
  {
    gltf: "gltf/killimanjaro.zip",
    name: "Killimanjaro",
  },
  {
    gltf: "gltf/grand-canyon.zip",
    name: "Grand Canyon",
  },
  {
    gltf: "gltf/dubai.zip",
    name: "Dubai",
  },
  {
    gltf: "gltf/everest.zip",
    name: "Everest",
  },
];

interface Props {
  view: SceneView;
  onClose: () => void;
  onAddObject: (object: Graphic) => void
}

@subclass("ExploreMars.page.AddObjectPage")
export class AddObjectPage extends Widget {
  constructor(props: Props) {
    super(props as any);
    this.onClose = props.onClose
    this.view = props.view;
    this.onAddObject = props.onAddObject;
  }

  private readonly onAddObject: (object: any) => void;
  private readonly onClose: () => void;

  @property()
  view!: SceneView;

  @property()
  private isAdding = false;

  @property()
  sketchViewModel!: SketchViewModel;

  render() {
    const items = objects.map((o) => this.domForOneObject(o));
    return (
      <div id="compare-objects" class={CSS.pageContainer}>
        <a
          class={CSS.closeButton}
          onclick={(e: Event) => {
            this.close(e);
          }}
        >
          <span></span>
        </a>
        <nav>{items}</nav>
      </div>
    )
  }

  private async editGltf(event: Event, el: GltfEl) {
    event.preventDefault();
    if (!this.isAdding) {
      try {
        await this.addGltf(el.gltf);
      } finally {
        this.isAdding = false;
      }
    }
  }

  public async addGltf(id: string, height: number | undefined = undefined) {
    const importer = new GlTFImporter();

    const url = new URL("/" + id, import.meta.url);

    const href = await importer.import(url.toString());

    const gltfModel = new ObjectSymbol3DLayer({
      anchor: "bottom",
      height,
      resource: {
        href,
        // primitive: "sphere"
      },
      // material: {
      //   // color: [255, 255, 255, 0.5]
      //   color: "#e6faff"
      // }
    });
    const view = this.view;
    const geometry = view.center.clone();
    geometry.z = 0;
    const graphic = new Graphic({
      geometry,
      symbol: new PointSymbol3D({
        symbolLayers: [gltfModel],
      }),
    });

    this.onAddObject(graphic);
  }

  private domForOneObject(gltf: GltfEl) {
    const id = gltf.gltf.split("/")[1].replace(".zip", "");

    return (
      <a
        id={id}
        class={this.classes(CSS.submenuItem)}
        onclick={(e: Event) => {
          void this.editGltf(e, gltf);
        }}
        enterAnimation={createEnterCssTransition("slideDown")}
      >
        {gltf.name}
      </a>
    );
  }

  private close(e: Event) {
    e.preventDefault();

    this.onClose();
  }
}

