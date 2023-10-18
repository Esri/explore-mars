import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { CSS } from "../widgets/constants";
import Camera from "@arcgis/core/Camera";
import * as layers from "./rover-layers";
import type SceneView from "@arcgis/core/views/SceneView";

const cameras = {
  perseverance: new Camera({
    position: {
      x: 77.31831,
      y: 17.9882,
      z: 7292.077,
      spatialReference: { wkid: 104971 },
    },
    heading: 15.53,
    tilt: 67.5,
  }),
  curiosity: new Camera({
    position: {
      x: 136.90526,
      y: -7.16597,
      z: 62217.981,
      spatialReference: { wkid: 104971 },
    },
    heading: 13.78,
    tilt: 65.46,
  }),
  opportunity: new Camera({
    position: {
      x: -5.7945,
      y: 0.66213,
      z: 77385.93,
      spatialReference: { wkid: 104971 },
    },
    heading: 173.58,
    tilt: 61.54,
  }),
};

@subclass("ExploreMars.menu.Location")
export class LocationPage extends Widget {
  constructor(view: SceneView) {
    super();
    this.view = view;
  }

  @property()
  view!: SceneView;

  async initialize() {
    const view = this.view;
    const missionLayer = layers.createMissionLayer();
    const marsNamesLayer = layers.createMarsNamesLayer();
    const perseveranceLayers = layers.createPerseveranceLayers();

    await Promise.all([
      missionLayer.when(),
      marsNamesLayer.when(),
      perseveranceLayers.when(),  
    ]);
    
    view.map.addMany([missionLayer, marsNamesLayer, perseveranceLayers]);    
  }

  render() {
    return (
      <nav id="submenu-location" class={CSS.pageContainer}>
        <a
          href=""
          class={this.classes(CSS.submenuItem)}
          onclick={(e: Event) => {
            this.goTo(e, "perseverance");
          }}
        >
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Perseverance Rover</div>
          </div>
        </a>
        <a
          href=""
          class={this.classes(CSS.submenuItem)}
          onclick={(e: Event) => {
            this.goTo(e, "curiosity");
          }}
        >
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Curiosity Rover</div>
          </div>
        </a>
        <a href="" class={this.classes(CSS.submenuItem)} style="display:none;">
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Martian Path</div>
          </div>
        </a>
        <a
          href=""
          class={this.classes(CSS.submenuItem)}
          onclick={(e: Event) => {
            this.goTo(e, "opportunity");
          }}
        >
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Opportunity Rover</div>
          </div>
        </a>
      </nav>
    );
  }

  private goTo(event: Event, rover: keyof typeof cameras) {
    event.preventDefault();
    const camera = cameras[rover];
    void this.view.goTo(camera);
  }
}
