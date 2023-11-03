import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { match } from "ts-pattern";
import { AddObjectPage } from "./object/AddObject";
import { AddRegionPage } from "./region/AddRegion";
import { watch } from "@arcgis/core/core/reactiveUtils";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./ComparePage.module.scss";
import { CloseButton } from "../utility-components/close-button/CloseButton";
import AppState from "../application/AppState";

type Page = "menu" | "regions" | "models";

const addRegionWidget = new AddRegionPage();
const addObjectWidget = new AddObjectPage();
@subclass("ExploreMars.page.CompareObject")
export class ComparePage extends Widget {
  @property()
  page: Page = "menu";

  initialize() {
    const watchPageHandle = watch(
      () => this.page,
      (page) => {
        if (page === "menu") return;
        addRegionWidget?.start();

        addObjectWidget?.start();
      },
    );
    this.addHandles(watchPageHandle);
  }

  render() {
    if (this.page === "menu") {
      AppState.status = "idle";

      return (
        <CompareMenu
          selectTool={(tool) => {
            this.page = tool;
          }}
        />
      );
    }

    AppState.status = "editing";

    const widget = match(this.page)
      .with("regions", () => addRegionWidget)
      .with("models", () => addObjectWidget)
      .exhaustive();

    return (
      <div class={styles.compareInfo}>
        <span class={styles.close}>
          <CloseButton
            onClose={() => {
              this.page = "menu";
            }}
          />
        </span>
        {widget.render()}
      </div>
    );
  }

  destroy() {
    super.destroy();
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
      Move the object in the view using the orange handles. Press "delete" to
      remove the object.
    </p>
  );
}
