import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Graphic from "@arcgis/core/Graphic";
import { useScene } from "../application/SceneContext";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import { importModel } from "./GlTFImporter";
import { EditingInfo } from "./ComparePage";
import { PanelSection } from "../utility-components/PanelSection";
import { errorMessage, isAbortError } from "../utilities/errors";
import zurich from "./gltf/zurich.zip";
import manhattan from "./gltf/manhattan.zip";
import kilimanjaro from "./gltf/killimanjaro.zip";
import grandCanyon from "./gltf/grand-canyon.zip";
import dubai from "./gltf/dubai.zip";
import everest from "./gltf/everest.zip";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-loader";
import "@esri/calcite-components/components/calcite-notice";
import "./AddObject.css";
import { createFromGLTF } from "@arcgis/core/geometry/support/meshUtils.js";
const objects = [
  { name: "Zurich", url: zurich },
  { name: "Manhattan", url: manhattan },
  { name: "Kilimanjaro", url: kilimanjaro },
  { name: "Grand Canyon", url: grandCanyon },
  { name: "Dubai", url: dubai },
  { name: "Everest", url: everest },
];

export function AddObjectPage() {
  const { view, resources } = useScene();
  const layer = resources.models;
  const sketch = useRef<SketchViewModel | null>(null);
  const [name, setName] = useState<string | null>(() => {
    const graphic = layer.graphics.getItemAt(0);
    return graphic ? String(graphic.getAttribute("name")) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const loadModel = useMutation({
    mutationFn: async (object: (typeof objects)[number]) => {
      const resource = await importModel(object.url);
      try {
        const center = view.center.clone();
        center.z = 0;
        const mesh = await createFromGLTF(center, resource.url);
        return new Graphic({
          geometry: mesh,
          attributes: { name: object.name },
          symbol: new MeshSymbol3D({ symbolLayers: [new FillSymbol3DLayer()] }),
        });
      } finally {
        resource.dispose();
      }
    },
  });

  function reportError(cause: unknown) {
    if (!isAbortError(cause)) {
      console.error(cause);
      setError(errorMessage(cause));
    }
  }

  useEffect(() => {
    const model = new SketchViewModel({
      view,
      layer,
      defaultUpdateOptions: {
        toggleToolOnClick: false,
        enableScaling: false,
        enableZ: true,
      },
    });
    sketch.current = model;
    const handle = model.on("delete", () => setName(null));
    return () => {
      handle.remove();
      model.destroy();
      sketch.current = null;
    };
  }, [view, layer]);

  const addModel = (object: (typeof objects)[number]) => {
    setError(null);
    loadModel.mutate(object, {
      onSuccess: (graphic) => {
        sketch.current?.cancel();
        layer.removeAll();
        layer.add(graphic);
        setName(object.name);
        void view.goTo({ target: graphic, scale: 250000, tilt: 70 }).catch(reportError);
        void sketch.current?.update(graphic, { enableScaling: false }).catch(reportError);
      },
    });
  };

  const message = error ?? (loadModel.error ? errorMessage(loadModel.error) : null);

  return (
    <>
      <div className="model-grid">
        {objects.map((object) => (
          <calcite-button
            key={object.name}
            appearance={name === object.name ? "solid" : "outline"}
            disabled={loadModel.isPending}
            onClick={() => addModel(object)}
          >
            {object.name}
          </calcite-button>
        ))}
      </div>
      {loadModel.isPending && (
        <calcite-loader label="Loading 3D model" text="Loading 3D model" scale="s" />
      )}
      {message && (
        <calcite-notice open kind="danger">
          <span slot="title">Could not place model</span>
          <span slot="message">{message}</span>
        </calcite-notice>
      )}
      {name && (
        <PanelSection>
          <h3>{name}</h3>
          <EditingInfo />
          <calcite-button
            appearance="outline"
            iconStart="trash"
            onClick={() => {
              loadModel.reset();
              sketch.current?.cancel();
              layer.removeAll();
              setName(null);
            }}
          >
            Remove model
          </calcite-button>
        </PanelSection>
      )}
    </>
  );
}
