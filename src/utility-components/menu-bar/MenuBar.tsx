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
import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from "./menu-bar.module.scss";
import cx from "classnames";
import AppState, { type Page } from "../../application/AppState";
import { PointerEventsContainer } from "../PointerEventsContainer";
import logo from "./images/logo.png";
import logoHighlighted from "./images/logo_highlighted.png";
import location from "./images/location.svg";
import measure from "./images/measure.svg";
import compare from "./images/compare.svg";
import esriLogo from "./images/esri-logo.png";
import { compareRoute } from "../../compare/ComparePage";
import { MeasureRoute } from "../../measure/MeasurePages";

interface MenuBarProps {
  onItemClick: (item: Page | any) => void;
}
export function MenuBar({ onItemClick }: MenuBarProps) {
  return (
    <PointerEventsContainer
      children={
        <nav class={styles.menu}>
          <a
            class={cx(styles.menuItem, styles.logoItem, styles.explore)}
            onclick={(e: Event) => {
              if (AppState.route.path === "landing") onItemClick("home");
              else onItemClick("landing");
            }}
          >
            <img
              class={cx(styles.icon, styles.exploreLogo)}
              src={logo}
              alt="Explore Mars"
            />
            <img
              class={cx(styles.icon, styles.exploreLogoHighlighted)}
              src={logoHighlighted}
              alt=""
            />
          </a>
          <div class={styles.items}>
            <a
              class={cx(styles.menuItem, styles.location)}
              onclick={(e: Event) => {
                if (AppState.route.path === "locations") onItemClick("home");
                else onItemClick("locations");
              }}
            >
              <img class={styles.icon} alt="" src={location} />
              <div class={styles.label}>Locations</div>
            </a>
            <a
              class={cx(styles.menuItem)}
              onclick={(e: Event) => {
                if (AppState.route.path === "measure") onItemClick("home");
                else onItemClick(MeasureRoute);
              }}
            >
              <img class={styles.icon} alt="" src={measure} />
              <div class={styles.label}>Measure</div>
            </a>
            <a
              class={cx(styles.menuItem, styles.compare)}
              onclick={(e: Event) => {
                if (AppState.route.match(compareRoute)) onItemClick("home");
                else onItemClick(compareRoute);
              }}
            >
              <img class={styles.icon} alt="" src={compare} />
              <div class={styles.label}>Compare</div>
            </a>
          </div>
          <a
            class={cx(styles.menuItem, styles.logoItem, styles.credits)}
            onclick={(e: Event) => {
              if (AppState.route.path === "credits") onItemClick("home");
              else onItemClick("credits");
            }}
          >
            <img
              class={cx(styles.icon, styles.esriLogo)}
              src={esriLogo}
              title="Credits"
              alt=""
            />
            <div class={styles.label}>ArcGIS Maps SDK for JavaScript</div>
          </a>
        </nav>
      }
    />
  );
}
