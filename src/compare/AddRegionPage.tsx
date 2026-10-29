import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Graphic from "@arcgis/core/Graphic";
import Environment from "@arcgis/core/views/3d/environment/Environment";
import type SceneView from "@arcgis/core/views/SceneView";
import { useScene } from "../application/SceneContext";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type { RedoEvent, UndoEvent, UpdateEvent } from "@arcgis/core/widgets/Sketch/types";
import * as centroidOperator from "@arcgis/core/geometry/operators/centroidOperator";
import ObjectSymbol3DLayer from "@arcgis/core/symbols/ObjectSymbol3DLayer";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import { graphicFromCountry } from "./countryUtils";
import RegionEditor from "./RegionEditor";
import { createRegionPreview } from "./regionWorker";
import { EditingInfo } from "./ComparePage";
import { PanelSection } from "../utility-components/PanelSection";
import { errorMessage, isAbortError } from "../utilities/errors";
import "@arcgis/map-components/components/arcgis-scene";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-notice";
import "./AddRegionPage.css";

const earthEnvironment = new Environment({
  atmosphereEnabled: false,
  starsEnabled: false,
  background: { type: "color", color: [0, 0, 0, 0] },
});

export function AddRegionPage() {
  const { view, resources, reportError } = useScene();
  const regions = resources.regions;
  const editing = resources.regionHandles;
  const [hasRegion, setHasRegion] = useState(() => regions.graphics.length > 0);
  const [sketch] = useState(
    () =>
      new SketchViewModel({
        view,
        layer: editing,
        updateOnGraphicClick: false,
        defaultUpdateOptions: {
          toggleToolOnClick: false,
          enableScaling: false,
          enableZ: false,
        },
      }),
  );
  const [editor] = useState(() => new RegionEditor(view));
  const [controller] = useState(() => new AbortController());

  const selection = useMutation({
    mutationFn: async ({
      earthView,
      point,
    }: {
      earthView: SceneView;
      point: { x: number; y: number };
    }) => {
      const result = await earthView.hitTest(point);
      const hit = result.results.find(
        (result) => result.type === "graphic" && result.graphic.layer instanceof FeatureLayer,
      );
      if (!hit || hit.type !== "graphic" || !(hit.graphic.layer instanceof FeatureLayer)) {
        throw new Error("Select a region on the globe");
      }
      const layerView = await earthView.whenLayerView(hit.graphic.layer);
      return { graphic: hit.graphic, layerView };
    },
    networkMode: "always",
  });

  const editRegion = useMutation({
    mutationFn: async ({
      country,
      preview,
      point,
    }: {
      country: Graphic;
      preview?: Polygon;
      point?: { x: number; y: number };
    }) => {
      controller.signal.throwIfAborted();
      if (point) {
        const result = await view.hitTest(point, { include: [regions, editing] });
        controller.signal.throwIfAborted();
        if (!result.results.some((hit) => hit.type === "graphic")) {
          return;
        }
      }
      const center = editing.graphics.getItemAt(0);
      if (regions.graphics.getItemAt(0) !== country) {
        throw new DOMException("The region is no longer placed.", "AbortError");
      }
      if (!(country.geometry instanceof Polygon)) {
        throw new Error("The selected country has no polygon geometry.");
      }
      if (!center) {
        throw new Error("The region is missing its editing handle.");
      }
      if (editor.country !== country) {
        const simplified =
          preview ?? (await createRegionPreview(country.geometry, controller.signal));
        controller.signal.throwIfAborted();
        if (regions.graphics.getItemAt(0) !== country) {
          throw new DOMException("The region is no longer placed.", "AbortError");
        }
        editor.setRegion(country, center, simplified);
      }
      if (!sketch.updateGraphics.includes(center)) {
        await sketch.update(center, { enableScaling: false });
      }
    },
    scope: { id: "region-editing" },
    networkMode: "always",
  });

  const { mutate: startEditing } = editRegion;

  const placement = useMutation({
    mutationFn: async (selected: Graphic) => {
      const { country, preview } = await graphicFromCountry(selected, view, controller.signal);
      controller.signal.throwIfAborted();
      if (!(country.geometry instanceof Polygon)) {
        throw new Error("The selected country has no polygon geometry.");
      }
      const centerPoint = centroidOperator.execute(country.geometry);
      return { country, preview, centerPoint };
    },
  });
  const selected = selection.data?.graphic;
  const { reset: resetSelection } = selection;
  const { reset: resetPlacement } = placement;
  const { reset: resetEditing } = editRegion;

  useEffect(() => {
    editing.visible = true;
    const updateRegion = (event: UpdateEvent | UndoEvent | RedoEvent) => {
      try {
        editor.update(event);
      } catch (cause) {
        reportError(cause);
      }
    };
    sketch.addHandles([
      reactiveUtils.watch(() => regions.graphics.length > 0, setHasRegion, { initial: true }),
      sketch.on("delete", () => {
        editor.clear();
        regions.removeAll();
        editing.removeAll();
        resetSelection();
        resetPlacement();
        resetEditing();
      }),
      sketch.on("update", updateRegion),
      sketch.on("undo", updateRegion),
      sketch.on("redo", updateRegion),
      view.on("click", (event) => {
        const country = regions.graphics.getItemAt(0);
        if (country) {
          startEditing({ country, point: { x: event.x, y: event.y } });
        }
      }),
      { remove: () => controller.abort() },
    ]);

    return () => {
      sketch.complete();
      sketch.destroy();
      editing.visible = false;
    };
  }, [
    view,
    regions,
    editing,
    sketch,
    editor,
    controller,
    startEditing,
    resetSelection,
    resetPlacement,
    resetEditing,
    reportError,
  ]);

  const selectCountry = (earthView: SceneView, point: { x: number; y: number }) => {
    sketch.removeHandles("country-highlight");
    placement.reset();
    editRegion.reset();
    selection.mutate(
      { earthView, point },
      {
        onSuccess: ({ graphic, layerView }) => {
          sketch.addHandles(layerView.highlight(graphic), "country-highlight");
        },
      },
    );
  };

  const placeCountry = () => {
    if (!selected) {
      return;
    }
    placement.mutate(selected, {
      onSuccess: ({ country, preview, centerPoint }) => {
        const center = new Graphic({
          geometry: centerPoint,
          symbol: new PointSymbol3D({
            symbolLayers: [
              new ObjectSymbol3DLayer({
                material: { color: "#f6a17b" },
                width: 5000,
                height: 5000,
                depth: 5000,
                resource: { primitive: "diamond" },
              }),
            ],
          }),
        });
        sketch.removeHandles("country-highlight");
        sketch.cancel();
        regions.removeAll();
        editing.removeAll();
        regions.add(country);
        editing.add(center);
        startEditing({ country, preview });
        void view.goTo(country).catch(reportError);
      },
    });
  };

  const busy = selection.isPending || placement.isPending;
  const mutationError = selection.error ?? placement.error ?? editRegion.error;
  const message =
    mutationError && !isAbortError(mutationError) ? errorMessage(mutationError) : null;

  return (
    <>
      {!hasRegion ? (
        <>
          <arcgis-scene
            className="earth-scene"
            itemId="df5009a0ea79444e92f48f50fe171bf1"
            environment={earthEnvironment}
            alphaCompositingEnabled
            popupDisabled
            onarcgisViewClick={(event) => selectCountry(event.currentTarget.view, event.detail)}
            onarcgisLoadError={(event) => reportError(event.detail)}
            onarcgisViewReadyError={(event) => reportError(event.detail)}
            aria-label="Select a region on the globe"
          />
          <p className="muted" role="status">
            {selected ? "Region selected" : "No region selected"}
          </p>
          <calcite-button
            width="full"
            disabled={!selected || busy}
            loading={busy}
            onClick={placeCountry}
          >
            Place it on Mars
          </calcite-button>
        </>
      ) : (
        <PanelSection>
          <EditingInfo />
        </PanelSection>
      )}
      {message && (
        <calcite-notice open kind="danger">
          <span slot="title">Region comparison unavailable</span>
          <span slot="message">{message}</span>
        </calcite-notice>
      )}
    </>
  );
}
