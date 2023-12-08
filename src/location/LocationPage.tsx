import { subclass } from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
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
            icon="../images/location.svg"
          />,
          <Item
            text="Curiosity Rover"
            onClick={() => {
              this.goTo("curiosity");
            }}
            itemClass={styles.curiosity}
            icon="../images/location.svg"
          />,
          <Item
            text="Opportunity Rover"
            onClick={() => {
              this.goTo("opportunity");
            }}
            itemClass={styles.opportunity}
            icon="../images/location.svg"
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
