import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Graphic from "@arcgis/core/Graphic";
import Environment from "@arcgis/core/views/3d/environment/Environment";
import type SceneView from "@arcgis/core/views/SceneView";
import { useScene } from "../application/SceneContext";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import type { UpdateEvent } from "@arcgis/core/widgets/Sketch/types";
import * as centroidOperator from "@arcgis/core/geometry/operators/centroidOperator";
import ObjectSymbol3DLayer from "@arcgis/core/symbols/ObjectSymbol3DLayer";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import TextSymbol3DLayer from "@arcgis/core/symbols/TextSymbol3DLayer";
import { graphicFromCountry } from "./countryUtils";
import PolygonTransform from "./PolygonTransform";
import { EditingInfo } from "./ComparePage";
import { PanelSection } from "../utility-components/PanelSection";
import { errorMessage, isAbortError } from "../utilities/errors";
import "@arcgis/map-components/components/arcgis-scene";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-notice";
import "./AddRegion.css";

const earthEnvironment = new Environment({
  atmosphereEnabled: false,
  starsEnabled: false,
  background: { type: "color", color: [0, 0, 0, 0] },
});

export function AddRegionPage() {
  const { view, resources } = useScene();
  const regions = resources.regions;
  const editing = resources.regionHandles;
  const [placed, setPlaced] = useState<Graphic | null>(() => regions.graphics.getItemAt(0) ?? null);
  const [error, setError] = useState<string | null>(null);
  const sketch = useRef<SketchViewModel | null>(null);
  const lastAngle = useRef(0);
  const transform = useRef(new PolygonTransform(view));
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
        throw new Error("Select a country on the Earth globe.");
      }
      const layerView = await earthView.whenLayerView(hit.graphic.layer);
      return { graphic: hit.graphic, layerView };
    },
    networkMode: "always",
  });
  const placement = useMutation({
    mutationFn: async (selected: Graphic) => {
      const country = await graphicFromCountry(selected, view);
      if (!(country.geometry instanceof Polygon)) {
        throw new Error("The selected country has no polygon geometry.");
      }
      const centerPoint = centroidOperator.execute(country.geometry);
      return { country, centerPoint };
    },
  });
  const selected = selection.data?.graphic;
  const { reset: resetSelection } = selection;

  useEffect(() => {
    editing.visible = true;
    const model = new SketchViewModel({
      view,
      layer: editing,
      defaultUpdateOptions: {
        toggleToolOnClick: false,
        enableScaling: false,
        enableZ: false,
      },
    });
    sketch.current = model;
    const handles = [
      model.on("delete", () => {
        regions.removeAll();
        editing.removeAll();
        setPlaced(null);
        resetSelection();
      }),
      model.on("update", (event: UpdateEvent) => {
        const country = regions.graphics.getItemAt(0);
        const label = regions.graphics.getItemAt(1);
        const center = editing.graphics.getItemAt(0);
        if (!(country?.geometry instanceof Polygon) || !center || !label) {
          return;
        }
        if (event.state === "start") {
          lastAngle.current = 0;
        }
        if (!event.toolEventInfo) {
          return;
        }
        const info = event.toolEventInfo;
        if (info.type === "rotate" || info.type === "rotate-start" || info.type === "rotate-stop") {
          country.geometry = transform.current.rotate(
            country.geometry,
            ((info.angle - lastAngle.current) * Math.PI) / 180,
          );
          lastAngle.current = info.type === "rotate-stop" ? 0 : info.angle;
        } else {
          country.geometry = transform.current.moveTo(country.geometry, center.geometry as Point);
          label.geometry = center.geometry;
        }
      }),
      view.on("click", (event) => {
        void view
          .hitTest(event, { include: [regions] })
          .then((result) => {
            if (sketch.current !== model || !result.results.some((hit) => hit.type === "graphic")) {
              return;
            }
            const center = editing.graphics.getItemAt(0);
            if (center) {
              void model.update(center, { enableScaling: false }).catch(reportError);
            }
          })
          .catch(reportError);
      }),
    ];
    function reportError(cause: unknown) {
      if (!isAbortError(cause)) {
        console.error(cause);
        setError(errorMessage(cause));
      }
    }
    return () => {
      handles.forEach((handle) => handle.remove());
      model.destroy();
      editing.visible = false;
      sketch.current = null;
    };
  }, [view, regions, editing, resetSelection]);

  useEffect(() => {
    if (!selection.data || placed) {
      return;
    }
    const { graphic, layerView } = selection.data;
    const highlight = layerView.highlight(graphic);
    return () => highlight.remove();
  }, [selection.data, placed]);

  const selectCountry = (earthView: SceneView, point: { x: number; y: number }) => {
    setError(null);
    placement.reset();
    selection.mutate({ earthView, point });
  };

  const placeCountry = () => {
    if (!selected) {
      return;
    }
    setError(null);
    placement.mutate(selected, {
      onSuccess: ({ country, centerPoint }) => {
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
        const label = new Graphic({
          geometry: centerPoint.clone(),
          symbol: new PointSymbol3D({
            symbolLayers: [
              new TextSymbol3DLayer({
                text: String(country.getAttribute("label")),
                material: { color: "white" },
                halo: { size: 1, color: "#151515" },
                font: { size: 10 },
              }),
            ],
            verticalOffset: {
              screenLength: 40,
              maxWorldLength: 500000,
              minWorldLength: 0,
            },
            callout: { type: "line", size: 0.5, color: "white" },
          }),
        });
        sketch.current?.cancel();
        regions.removeAll();
        editing.removeAll();
        regions.addMany([country, label]);
        editing.add(center);
        lastAngle.current = 0;
        setPlaced(country);
        void view.goTo(country).catch((cause: unknown) => {
          if (!isAbortError(cause)) {
            console.error(cause);
            setError(errorMessage(cause));
          }
        });
        void sketch.current?.update(center, { enableScaling: false }).catch((cause: unknown) => {
          if (!isAbortError(cause)) {
            console.error(cause);
            setError(errorMessage(cause));
          }
        });
      },
    });
  };

  const busy = selection.isPending || placement.isPending;
  const mutationError = selection.error ?? placement.error;
  const message = error ?? (mutationError ? errorMessage(mutationError) : null);

  return (
    <>
      {!placed ? (
        <>
          <arcgis-scene
            className="earth-scene"
            itemId="df5009a0ea79444e92f48f50fe171bf1"
            environment={earthEnvironment}
            alphaCompositingEnabled
            popupDisabled
            onarcgisViewClick={(event) => selectCountry(event.currentTarget.view, event.detail)}
            onarcgisLoadError={(event) => {
              console.error(event.detail);
              setError(errorMessage(event.detail));
            }}
            onarcgisViewReadyError={(event) => {
              console.error(event.detail);
              setError(errorMessage(event.detail));
            }}
            aria-label="Select a country on Earth"
          />
          <p className="muted" role="status">
            {selected
              ? String(
                  selected.getAttribute(
                    selected.layer instanceof FeatureLayer
                      ? (selected.layer.displayField ?? "name")
                      : "name",
                  ) ?? "Region selected",
                )
              : "No region selected"}
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
          <h3>{String(placed.getAttribute("label"))}</h3>
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
