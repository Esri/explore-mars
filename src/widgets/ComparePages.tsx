import type Graphic from "@arcgis/core/Graphic";
import WebScene from "@arcgis/core/WebScene";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import * as promiseUtils from "@arcgis/core/core/promiseUtils";
import SceneView from "@arcgis/core/views/SceneView";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { createEnterCssTransition } from "maquette-css-transitions";
import type AppState from "./AppState";
import { graphicFromCountry } from "./countryUtils";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

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

@subclass("ExploreMars.page.CompareObject")
export class CompareObjectPage extends Widget {
  constructor(args: { appState: AppState }) {
    super(args as any);
  }

  @property()
  appState!: AppState;

  @property()
  isAdding = false;

  render() {
    const items = objects.map((o) => this.domForOneObject(o));

    return (
      <div id="compare-objects" class={CSS.pageContainer}>
        <a
          class={CSS.closeButton}
          onclick={() => {
            this.close();
          }}
        >
          <span></span>
        </a>
        <nav>{items}</nav>
      </div>
    );
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

  private async editGltf(event: Event, el: GltfEl) {
    event.preventDefault();
    this.appState.currentPageAbove = null;
    if (!this.isAdding) {
      try {
        await this.appState.editingState.addGltf(el.gltf);
      } finally {
        this.isAdding = false;
      }
    }
  }

  private close() {
    setTimeout(() => {
      this.appState.currentPageAbove = null;
      this.destroy();
    }, 1);
  }
}

@subclass("ExploreMars.page.EditObjectPage")
export class EditObjectPage extends Widget {
  constructor(args: { appState: AppState }) {
    super(args as any);
  }

  @property()
  appState!: AppState;

  render() {
    return (
      <div id="edit-objects" class={CSS.pageContainer}>
        <a
          class={CSS.closeButton}
          onclick={(e: Event) => {
            this.close(e);
          }}
        >
          <span></span>
        </a>
        <p>
          Move the object in the view using the orange handles. Press "delete"
          to remove the object.
        </p>
      </div>
    );
  }

  private close(e: Event) {
    e.preventDefault();
    this.appState.editingState.doneEditing();
  }
}

@subclass("ExploreMars.page.AddRegionPage")
export class AddRegionPage extends Widget {
  constructor(args: { appState: AppState }) {
    super(args as any);
  }

  @property()
  appState!: AppState;

  @property()
  selectedRegion: Graphic | null = null;

  @property()
  highlight?: IHandle;

  overlayGlobe?: SceneView | null;

  render() {
    return (
      <div id="add-region">
        <a
          class={CSS.closeButton}
          onclick={(e: Event) => {
            this.close(e);
          }}
        >
          <span></span>
        </a>
        <p>Select a region on the globe</p>
        <div
          id="add-region-view"
          afterCreate={(element: HTMLDivElement) => {
            this.createView(element);
          }}
        ></div>
        <div class="buttons">
          <button
            class="esri-button esri-button--primary"
            disabled={this.selectedRegion == null}
            onclick={async (e: Event) => {
              await this.placeIt(e);
            }}
          >
            Place it on Mars
          </button>
        </div>
      </div>
    );
  }

  private async placeIt(event: Event) {
    event.preventDefault();
    if (this.selectedRegion == null) {
      return;
    }
    this.appState.editingState.cancelEditing();
    this.appState.currentPageAbove = null;
    this.appState.editingState.loading = true;

    const country = await graphicFromCountry(
      this.selectedRegion,
      this.appState.view,
    );

    this.appState.editingState.addCountry(country);
  }

  private createView(element: HTMLDivElement) {
    const overlayGlobe = new SceneView({
      container: element,
      qualityProfile: "high",
      map: new WebScene({
        portalItem: {
          id: "df5009a0ea79444e92f48f50fe171bf1",
        },
      }),
      alphaCompositingEnabled: true,
      environment: {
        atmosphereEnabled: false,
        starsEnabled: false,
      },
      constraints: {
        altitude: {
          min: 0,
          max: 25512548 * 4,
        },
      },
    });

    overlayGlobe.ui.components = [];
    overlayGlobe.environment.background = {
      type: 'color',
      color: [255, 255, 255, 0],
    } as unknown as __esri.Background;

    overlayGlobe.popupEnabled = false;

    overlayGlobe.on(
      "click",
      promiseUtils.debounce(async (e) => {
        this.resetRegion();
        const hitTest = await overlayGlobe.hitTest(e);

        if (hitTest.results.length > 0) {
          const result = hitTest.results[hitTest.results.length - 1];
          if (result.type === "graphic") {
            this.selectedRegion = result.graphic;
            const lv = await overlayGlobe.whenLayerView(result.graphic.layer as FeatureLayer);
            this.highlight = lv.highlight(result.graphic);
          }
        }
        this.scheduleRender();
      }),
    );

    this.overlayGlobe = overlayGlobe;
  }

  resetRegion = () => {
    if (this.highlight != null) {
      this.highlight.remove();
    }

    this.selectedRegion = null;
  };

  private close(e: Event) {
    e.preventDefault();
    if (this.overlayGlobe != null) {
      this.overlayGlobe.destroy();
    }
    this.overlayGlobe = null;

    this.appState.currentPageAbove = null;
  }
}
