import { subclass } from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import style from "./CreditsPage.module.scss";
import { CloseButton } from "../utility-components/close-button/CloseButton";
import AppState from "../application/AppState";

@subclass("ExploreMars.menu.Credit")
export class CreditsPage extends Widget {
  render() {
    return (
      <div style="display:contents">
        <span class={style.close}>
          <CloseButton onClose={() => AppState.route.back()} />
        </span>
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
            <a href="https://js.arcgis.com">ArcGIS Maps SDK for JavaScript</a>.
          </p>
        </div>
        <hr />
        <div class={style.credit}>
          NASA, ESA, HRSC, Goddard Space Flight Center | USGS Astrogeology Science
          Center, Esri, JPL | Wikipedia
        </div>
      </div>
    )
  }
}
