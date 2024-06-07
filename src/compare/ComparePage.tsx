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
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { match } from "ts-pattern";
import { AddObjectPage } from "./AddObject";
import { AddRegionPage } from "./AddRegion";
import { watch } from "@arcgis/core/core/reactiveUtils";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./ComparePage.module.scss";
import { CloseButton } from "../utility-components/close-button/CloseButton";
import AppState, { Route } from "../application/AppState";

type Page = "menu" | "regions" | "models";

export const compareRoute = new Route({
  path: "menu",
  route: "compare",
  paths: ["menu", "models", "regions"],
});

@subclass("ExploreMars.page.CompareObject")
export class ComparePage extends Widget {
  postInitialize() {
    const watchPageHandle = watch(
      () => compareRoute.path,
      (page) => {
        match(page)
          .with("menu", () => {
            AppState.status = "idle";
          })
          .with("models", () => {
            AppState.status = "editing";
          })
          .with("regions", () => {
            AppState.status = "editing";
          })
          .run();
      },
    );
    this.addHandles(watchPageHandle);
  }

  render() {
    if (compareRoute.path === "menu") {
      return (
        <div>
          <CompareMenu
            selectTool={(tool) => {
              compareRoute.push(tool, "selecting");
            }}
          />
        </div>
      );
    }

    return (
      <div class={styles.compareInfo}>
        <span class={styles.close}>
          <CloseButton
            onClose={() => {
              compareRoute.reset();
              AppState.route.back();
            }}
          />
        </span>
        {compareRoute.path === "regions" ? <AddRegionPage /> : null}
        {compareRoute.path === "models" ? <AddObjectPage /> : null}
      </div>
    );
  }
}

interface CompareMenuProps {
  selectTool: (tool: Exclude<Page, "menu">) => void;
}
function CompareMenu({ selectTool }: CompareMenuProps) {
  return (
    <SubMenu
      items={[
        <Item
          text="Regions"
          onClick={() => {
            selectTool("regions");
          }}
          itemClass={styles.regions}
        />,
        <Item
          text="Models"
          onClick={() => {
            selectTool("models");
          }}
          itemClass={styles.models}
        />,
      ]}
    />
  );
}

export function EditingInfo() {
  return (
    <p>
      Move the object in the view using the green handles. Press "delete" to
      remove the object.
    </p>
  );
}
