import {
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { CSS } from "../widgets/constants";

@subclass("ExploreMars.menu.Credit")
export class CreditsPage extends Widget {

  render() {
    return (
      <div id="submenu-credit" class={CSS.pageContainer} style="margin: 25px;">
        <div>
          <p>
            <strong>Explore Mars in 3D!</strong>
          </p>

          <p>
            Various imagery layers and detailed terrain allow you to explore the
            planet's surface. Place Earth-sized regions and 3D models to better
            understand distances and elevation on Mars.
          </p>
          <p>
            The app was built using the{" "}
            <a href="https://js.arcgis.com">ArcGIS API for JavaScript</a>.
          </p>
        </div>
        <hr />
        <div class="credit">
          NASA, ESA, HRSC, Goddard Space Flight Center | USGS Astrogeology
          Science Center, Esri, JPL | Wikipedia
        </div>
      </div>
    );
  }
}
