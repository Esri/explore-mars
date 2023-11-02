import { subclass } from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import * as layers from "./rover-layers";
import AppState from "../application/AppState";
import styles from "./LocationPage.module.scss";
import { Item, SubMenu } from "../utility-components/SubMenu";

const cameras = {
  perseverance: {
    position: {
      x: 77.31831,
      y: 17.9882,
      z: 7292.077,
      spatialReference: { wkid: 104971 },
    },
    heading: 15.53,
    tilt: 67.5,
  },
  curiosity: {
    position: {
      x: 136.90526,
      y: -7.16597,
      z: 62217.981,
      spatialReference: { wkid: 104971 },
    },
    heading: 13.78,
    tilt: 65.46,
  },
  opportunity: {
    position: {
      x: -5.7945,
      y: 0.66213,
      z: 77385.93,
      spatialReference: { wkid: 104971 },
    },
    heading: 173.58,
    tilt: 61.54,
  },
};

@subclass("ExploreMars.menu.Location")
export class LocationPage extends Widget {
  private _destroy: () => void;

  async initialize() {
    const view = AppState.view;
    const missionLayer = layers.createMissionLayer();
    const marsNamesLayer = layers.createMarsNamesLayer();
    const perseveranceLayers = layers.createPerseveranceLayers();

    view.map.addMany([missionLayer, marsNamesLayer, perseveranceLayers]);
    this._destroy = () => {
      view.map.removeMany([missionLayer, marsNamesLayer, perseveranceLayers]);
      missionLayer.destroy();
      marsNamesLayer.destroy();
      perseveranceLayers.destroy();
    };
  }

  destroy(): void {
    super.destroy();
    this._destroy();
  }

  render() {
    return (
      <SubMenu
        items={[
          <Item
            text="Perseverance Rover"
            onClick={() => {
              this.goTo("perseverance");
            }}
            itemClass={styles.perseverance}
          />,
          <Item
            text="Curiosity Rover"
            onClick={() => {
              this.goTo("curiosity");
            }}
            itemClass={styles.curiosity}
          />,
          <Item
            text="Opportunity Rover"
            onClick={() => {
              this.goTo("opportunity");
            }}
            itemClass={styles.opportunity}
          />,
        ]}
      />
    );
  }

  private goTo(rover: keyof typeof cameras) {
    const camera = cameras[rover];
    void AppState.view.goTo(camera);
  }
}
