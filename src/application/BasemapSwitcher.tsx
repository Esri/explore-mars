import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type SceneView from "@arcgis/core/views/SceneView";
import {
  marsHiRiseImagery,
  marsImageryBasemap,
  shadedReliefBasemap,
  marsNamesLayer,
  missionLayer,
} from "../utilities/layers";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";
import "@esri/calcite-components/components/calcite-switch";

export function BasemapSwitcher({
  view,
  onError,
}: {
  view: SceneView;
  onError: (error: unknown) => void;
}) {
  const [imagery, setImagery] = useState(view.map?.basemap === marsImageryBasemap);
  const [labels, setLabels] = useState(marsNamesLayer.visible);
  const [missions, setMissions] = useState(missionLayer.visible);
  const { mutate: updateVisibility, reset } = useMutation({
    mutationFn: () =>
      view.hitTest({
        x: view.width / 2,
        y: view.height / 2,
      }),
    networkMode: "always",
  });

  useEffect(() => {
    const update = () =>
      updateVisibility(undefined, {
        onSuccess: (result) => {
          marsHiRiseImagery.visible =
            result.ground?.mapPoint != null && (result.ground.distance ?? Infinity) < 10000;
        },
        onError,
      });
    const handles = [
      reactiveUtils.watch(
        () => view.map?.basemap,
        (basemap) => {
          const isImagery = basemap === marsImageryBasemap;
          setImagery(isImagery);
          view.environment.atmosphereEnabled = isImagery;
        },
        { initial: true },
      ),
      reactiveUtils.when(() => view.stationary, update, { initial: true }),
    ];
    return () => {
      handles.forEach((handle) => handle.remove());
      reset();
    };
  }, [view, onError, updateVisibility, reset]);

  return (
    <div className="panel-content">
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
      <p className="muted">
        High-resolution HiRISE imagery appears automatically when you move close to the surface.
      </p>
    </div>
  );
}
