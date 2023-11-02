import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from "./menu-bar.module.scss";
import cx from "classnames";
import { type Page } from "../application/AppState";
import { PointerEventsContainer } from "./PointerEventsContainer";

interface MenuBarProps {
  onItemClick: (item: Page) => void;
}
export function MenuBar({ onItemClick }: MenuBarProps) {
  return (
    <PointerEventsContainer
      children={
        <nav class={styles.menu}>
          <a
            class={cx(styles.menuItem, styles.logoItem, styles.explore)}
            onclick={(e: Event) => {
              onItemClick("landing");
            }}
          >
            <img
              class={cx(styles.icon, styles.exploreLogo)}
              src="../images/logo.png"
              alt="Explore Mars"
            />
            <img
              class={cx(styles.icon, styles.exploreLogoHighlighted)}
              src="../images/logo_highlighted.png"
              alt=""
            />
          </a>
          <div class={styles.items}>
            <a
              class={cx(styles.menuItem, styles.location)}
              onclick={(e: Event) => {
                onItemClick("locations");
              }}
            >
              <img class={styles.icon} alt="" src="../images/location.svg" />
              <div class={styles.label}>Locations</div>
            </a>
            <a
              class={cx(styles.menuItem)}
              onclick={(e: Event) => {
                onItemClick("measure");
              }}
            >
              <img class={styles.icon} alt="" src="../images/measure.svg" />
              <div class={styles.label}>Measure</div>
            </a>
            <a
              class={cx(styles.menuItem, styles.compare)}
              onclick={(e: Event) => {
                onItemClick("compare");
              }}
            >
              <img class={styles.icon} alt="" src="../images/compare.svg" />
              <div class={styles.label}>Compare</div>
            </a>
          </div>
          <a
            class={cx(styles.menuItem, styles.logoItem, styles.credits)}
            onclick={(e: Event) => {
              onItemClick("credits");
            }}
          >
            <img
              class={cx(styles.icon, styles.esriLogo)}
              src="../images/esri-logo.png"
              title="Credits"
              alt=""
            />
            <div class={styles.label}>ArcGIS API for Javascript</div>
          </a>
        </nav>
      }
    />
  );
}
