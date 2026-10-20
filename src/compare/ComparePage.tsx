import { useState } from "react";
import type SceneView from "@arcgis/core/views/SceneView";
import type { SceneResources } from "../application/scene";
import { AddObjectPage } from "./AddObject";
import { AddRegionPage } from "./AddRegion";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";

export function ComparePage({
  view,
  resources,
  active,
}: {
  view: SceneView;
  resources: SceneResources;
  active: boolean;
}) {
  const [mode, setMode] = useState<"models" | "regions">("models");
  if (!active) {
    return null;
  }

  return (
    <>
      <calcite-segmented-control
        label="Comparison type"
        width="full"
        oncalciteSegmentedControlChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "models" || value === "regions") {
            setMode(value);
          }
        }}
      >
        <calcite-segmented-control-item value="models" checked={mode === "models"}>
          3D models
        </calcite-segmented-control-item>
        <calcite-segmented-control-item value="regions" checked={mode === "regions"}>
          Earth regions
        </calcite-segmented-control-item>
      </calcite-segmented-control>
      {mode === "models" && <AddObjectPage view={view} layer={resources.models} />}
      {mode === "regions" && (
        <AddRegionPage view={view} regions={resources.regions} editing={resources.regionHandles} />
      )}
    </>
  );
}

export function EditingInfo() {
  return (
    <p className="instructions">
      Drag the handles in the scene to move or rotate the comparison. Its real-world size is
      preserved. Select it again to continue editing. Press Delete or use Remove to clear it.
    </p>
  );
}
