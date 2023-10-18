import Graphic from "@arcgis/core/Graphic";
import WebScene from "@arcgis/core/WebScene";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import * as promiseUtils from "@arcgis/core/core/promiseUtils";
import SceneView from "@arcgis/core/views/SceneView";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { graphicFromCountry } from "../widgets/countryUtils";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { type Polygon } from "@arcgis/core/geometry";
import { PointSymbol3D, ObjectSymbol3DLayer, TextSymbol3DLayer } from "@arcgis/core/symbols";
import Handles from "@arcgis/core/core/Handles";

const CSS = {
  closeButton: "close-button",
  pageContainer: "page-container",
};

interface Region {
  label: Graphic;
  center: Graphic;
  country: Graphic;
}

interface Props {
  view: SceneView;
  onClose: () => void;
  onAddRegion: (region: Region) => void
}

@subclass("ExploreMars.page.AddRegionPage")
export class AddRegionPage extends Widget {
  constructor(props: Props) {
    super();
    this.view = props.view;
    this.onClose = props.onClose
    this.onAddRegion = props.onAddRegion
  }

  private readonly onAddRegion: Props['onAddRegion'];
  private readonly onClose: () => void;

  @property()
  view!: SceneView;

  @property()
  selectedRegion: Graphic | null = null;

  @property()
  placedRegion: Graphic | null = null;

  @property()
  highlight?: IHandle;

  overlayGlobe?: SceneView | null;

  @property()
  handles = new Handles();

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

    this.placedRegion = this.selectedRegion;

    const country = await graphicFromCountry(
      this.placedRegion,
      this.view,
    );

    this.selectedRegion = null;
    this.addCountry(country);
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
        background: {
          type: 'color',
          color: [255, 255, 255, 0],
        }
      },
      constraints: {
        altitude: {
          min: 0,
          max: 25512548 * 4,
        },
      },
      ui: {
        components: []
      },
      popupEnabled: false
    });

    const handle = overlayGlobe.on(
      "click",
      promiseUtils.debounce(async (e) => {
        this.highlight?.remove();
        const hitTest = await overlayGlobe.hitTest(e);

        if (hitTest.results.length > 0) {
          const result = hitTest.results[hitTest.results.length - 1];
          if (result.type === "graphic") {
            this.selectedRegion = result.graphic;
            const lv = await overlayGlobe.whenLayerView(result.graphic.layer as FeatureLayer);
            this.highlight = lv.highlight(result.graphic);
          }
        }
      }),
    );

    this.handles.add(handle);

    this.overlayGlobe = overlayGlobe;
  }

  private addCountry(country: Graphic) {
    const centroid = (country.geometry as Polygon).centroid;

    const center = new Graphic({
      geometry: centroid,
      symbol: new PointSymbol3D({
        symbolLayers: [
          new ObjectSymbol3DLayer({
            material: {
              color: "white",
            },
            width: 5_000,
            height: 5_000,
            depth: 5_000,
            resource: {
              primitive: "diamond",
            },
          }),
        ],
      }),
    });

    const labelGraphic = new Graphic({
      geometry: centroid,
      symbol: new PointSymbol3D({
        symbolLayers: [
          new TextSymbol3DLayer({
            text: country.getAttribute("label"),
            material: {
              color: [0, 0, 0, 0.9],
            },
            halo: {
              size: 2,
              color: [255, 255, 255, 0.7],
            },
            font: {
              size: 10,
            },
          }),
        ],
        verticalOffset: {
          screenLength: 40,
          maxWorldLength: 500000,
          minWorldLength: 0,
        },
        callout: {
          type: "line",
          size: 0.5,
          color: [255, 255, 255, 0.9],
          border: {
            color: [0, 0, 0, 0.3],
          },
        },
      }),
    });

    this.onAddRegion({
      center,
      country,
      label: labelGraphic
    })
  }

  private close(e: Event) {
    e.preventDefault();
    if (this.overlayGlobe != null) {
      this.overlayGlobe.destroy();
    }

    this.selectedRegion = null;
    this.placedRegion = null;
    this.overlayGlobe = null;

    this.onClose();
  }
}
