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
import { subclass } from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import AppState from "./AppState";
import { ComparePage } from "../compare/ComparePage";
import { MeasurePage } from "../measure/MeasurePages";
import { match } from "ts-pattern";
import type { Page } from "./AppState";
import { LocationPage } from "../location/LocationPage";
import { CreditsPage } from "../credits/CreditsPage";
import { LandingPage } from "../home/HomePage";
import { enableBasemapSwitcher } from "./BasemapSwitcher";
import { CookieBanner } from "../utility-components/CookieBanner";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { Loading } from "../utility-components/Loading";
import styles from "./app.module.scss";
import { MenuBar } from "../utility-components/menu-bar/MenuBar";
import { Page as PageWrapper } from "../utility-components/Page";

@subclass("ExploreMars.Application")
class Application extends Widget {
  initialize() {
    this.addHandles([
      reactiveUtils.when(
        () => AppState.status !== "uninitialized",
        () => {
          enableBasemapSwitcher(AppState.view);
        },
      ),
    ]);
  }

  renderPage(page: string) {
    return match(page)
      .with("home", () => <div style="display:none;" />)
      .with("landing", () => <div style="display:none;" />)
      .with("measure", () => <MeasurePage />)
      .with("compare", () => <ComparePage />)
      .with("credits", () => <CreditsPage />)
      .with("locations", () => <LocationPage />)
      .run()!;
  }

  render() {
    const path = AppState.route.path;

    const content = match(AppState.status)
      .with("loading", () => <Loading />)
      .otherwise(() => this.renderPage(path));

    return (
      <div class={styles.wrapper}>
        <MenuBar
          onItemClick={(item) => {
            this.goToPage(item);
          }}
        />
        <CookieBanner />
        <PageWrapper
          hidden={
            AppState.route.match("home") || AppState.route.match("landing")
          }
          children={content}
          class={AppState.status === "editing" ? styles.obscureMenu : ""}
        />
        <LandingPage
          hidden={!AppState.route.match("landing")}
          onStart={() => {
            this.goToPage("home");
          }}
        />
      </div>
    );
  }

  private goToPage(page: Page) {
    AppState.route.push(page);
  }
}

export default Application;
