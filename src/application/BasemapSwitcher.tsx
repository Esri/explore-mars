import { useEffect, useState } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import {
  marsImageryBasemap,
  shadedReliefBasemap,
  marsNamesLayer,
  missionLayer,
} from "../utilities/layers";
import { useScene } from "./SceneContext";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";
import "@esri/calcite-components/components/calcite-switch";

export function BasemapSwitcher() {
  const { view } = useScene();
  const [imagery, setImagery] = useState(view.map?.basemap === marsImageryBasemap);
  const [labels, setLabels] = useState(marsNamesLayer.visible);
  const [missions, setMissions] = useState(missionLayer.visible);
  useEffect(() => {
    const handle = reactiveUtils.watch(() => view.map?.basemap === marsImageryBasemap, setImagery, {
      initial: true,
    });
    return () => handle.remove();
  }, [view]);

  return (
    <>
      <calcite-label>
        Basemap
        <calcite-segmented-control
          label="Basemap"
          oncalciteSegmentedControlChange={(event) => {
            if (view.map) {
              view.map.basemap =
                event.currentTarget.value === "imagery" ? marsImageryBasemap : shadedReliefBasemap;
            }
          }}
        >
          <calcite-segmented-control-item value="imagery" checked={imagery}>
            Imagery
          </calcite-segmented-control-item>
          <calcite-segmented-control-item value="relief" checked={!imagery}>
            Shaded relief
          </calcite-segmented-control-item>
        </calcite-segmented-control>
      </calcite-label>
      <calcite-label layout="inline">
        Place names
        <calcite-switch
          checked={labels}
          oncalciteSwitchChange={(event) => {
            marsNamesLayer.visible = event.currentTarget.checked;
            setLabels(event.currentTarget.checked);
          }}
        />
      </calcite-label>
      <calcite-label layout="inline">
        Mission landing sites
        <calcite-switch
          checked={missions}
          oncalciteSwitchChange={(event) => {
            missionLayer.visible = event.currentTarget.checked;
            setMissions(event.currentTarget.checked);
          }}
        />
      </calcite-label>
    </>
  );
}
