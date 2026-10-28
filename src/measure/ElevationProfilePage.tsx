import { useState } from "react";
import Collection from "@arcgis/core/core/Collection";
import ElevationProfileLineGround from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineGround";
import ElevationProfileLineScene from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineScene";
import type { ElevationProfileLineUnion } from "@arcgis/core/analysis/ElevationProfile/types";
import { useScene } from "../application/SceneContext";
import "@arcgis/map-components/components/arcgis-elevation-profile";

export function ElevationProfilePage() {
  const { reportError } = useScene();
  const [profiles] = useState(
    () =>
      new Collection<ElevationProfileLineUnion>([
        new ElevationProfileLineGround({ color: "#f6a17b" }),
        new ElevationProfileLineScene({ color: "#9bc7df" }),
      ]),
  );

  return (
    <arcgis-elevation-profile
      referenceElement="mars-scene"
      profiles={profiles}
      distanceUnit="metric"
      elevationUnit="metric"
      onarcgisReady={(event) => {
        void event.currentTarget.start().catch(reportError);
      }}
    />
  );
}
