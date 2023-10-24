import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { match } from 'ts-pattern';
import { AddObjectPage } from "./AddObject";
import { AddRegionPage } from "./AddRegion";
import Handles from "@arcgis/core/core/Handles";
import { watch, when } from "@arcgis/core/core/reactiveUtils";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from './ComparePage.module.scss';

type Page =
| 'menu'
| 'regions'
| 'models';

@subclass("ExploreMars.page.CompareObject")
export class ComparePage extends Widget {
  @property()
  page: Page = 'menu'

  @property()
  handles = new Handles();

  private addRegionWidget!: AddRegionPage;
  private addObjectWidget!: AddObjectPage;

  initialize() {
    this.addRegionWidget = new AddRegionPage();
    this.addObjectWidget = new AddObjectPage();

    const watchPageHandle = watch(() => this.page, (page) => {
      match(page)
      .with('regions', () => { this.addRegionWidget.isEditing = true })
      .with('models', () => { this.addObjectWidget.isEditing = true })
    });

    const watchEditingHandle = when(() => !this.addRegionWidget.isEditing && !this.addObjectWidget.isEditing, () => {
      this.page = 'menu';

      this.addRegionWidget.destroy();
      this.addObjectWidget.destroy();

      this.addRegionWidget = new AddRegionPage();
      this.addObjectWidget = new AddObjectPage();
    });

    this.handles.add([watchPageHandle, watchEditingHandle]);
  }

  render() {
    if (this.page === "menu") return <CompareMenu selectTool={(tool) => { this.page = tool }} />

    const widget = match(this.page)
    .with('models', () => this.addObjectWidget)
    .with('regions', () => this.addRegionWidget)
    .exhaustive();

    return widget.render();
  }

  destroy() {
    super.destroy();
    this.handles.removeAll();
    this.handles.destroy();
    this.addRegionWidget.destroy();
    this.addObjectWidget.destroy();
  }
}

interface CompareMenuProps {
  selectTool: (tool: Exclude<Page, 'menu'>) => void
}
function CompareMenu({ selectTool }: CompareMenuProps) {
  return (
    <SubMenu
      items={[
        <Item
          text="Regions"
          onClick={() => { selectTool('regions'); }}
          itemClass={styles.regions}
        />,
        <Item
          text="Models"
          onClick={() => { selectTool('models'); }}
          itemClass={styles.models}
        />
      ]}
    />
  );
}

export function EditingInfo() {

  return ( 
    <p>
      Move the object in the view using the orange handles. Press "delete"
      to remove the object.
    </p>
  )
}