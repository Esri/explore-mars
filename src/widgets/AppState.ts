import Accessor from "@arcgis/core/core/Accessor";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";

export type Page = 
| 'landing'
| 'home'
| 'locations'
| 'measure'
| 'compare'
| 'credits'

@subclass("ExploreMars.AppState")
export class AppState extends Accessor {
  @property()
  page: Page = 'landing'

  @property()
  loading: 'idle' | 'loading' = 'idle';
}

export default AppState;
