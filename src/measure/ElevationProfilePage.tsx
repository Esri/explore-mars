import { useState } from "react";
import Collection from "@arcgis/core/core/Collection";
import ElevationProfileLineGround from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineGround";
import type { ElevationProfileLineUnion } from "@arcgis/core/analysis/ElevationProfile/types";
import { useScene } from "../application/SceneContext";
import "@arcgis/map-components/components/arcgis-elevation-profile";

export function ElevationProfilePage() {
  const { reportError } = useScene();
  const [profiles] = useState(
    () =>
      new Collection<ElevationProfileLineUnion>([
        new ElevationProfileLineGround({ color: "green" }),
      ]),
  );

  return (
    <arcgis-elevation-profile
      referenceElement="mars-scene"
      profiles={profiles}
      onarcgisReady={(event) => {
        void event.currentTarget.start().catch(reportError);
      }}
    />
  );
}
