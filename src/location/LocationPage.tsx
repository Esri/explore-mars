import { useState } from "react";
import Camera from "@arcgis/core/Camera";
import type SceneView from "@arcgis/core/views/SceneView";
import { isAbortError } from "../utilities/errors";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";
import "./LocationPage.css";

const locations = [
  {
    id: "perseverance",
    name: "Perseverance",
    place: "Jezero crater",
    camera: new Camera({
      position: {
        x: 77.31831,
        y: 17.9882,
        z: 7292.077,
        spatialReference: { wkid: 104971 },
      },
      heading: 15.53,
      tilt: 67.5,
    }),
  },
  {
    id: "curiosity",
    name: "Curiosity",
    place: "Gale crater",
    camera: new Camera({
      position: {
        x: 136.90526,
        y: -7.16597,
        z: 62217.981,
        spatialReference: { wkid: 104971 },
      },
      heading: 13.78,
      tilt: 65.46,
    }),
  },
  {
    id: "opportunity",
    name: "Opportunity",
    place: "Meridiani Planum",
    camera: new Camera({
      position: {
        x: -5.7945,
        y: 0.66213,
        z: 77385.93,
        spatialReference: { wkid: 104971 },
      },
      heading: 173.58,
      tilt: 61.54,
    }),
  },
];

export function LocationPage({
  view,
  onError,
}: {
  view: SceneView;
  onError: (error: unknown) => void;
}) {
  const [selected, setSelected] = useState(locations[0]);
  return (
    <>
      <p className="eyebrow">Rover landing sites</p>
      <calcite-list
        label="Rover landing sites"
        selectionMode="single-persist"
        selectionAppearance="highlight"
      >
        {locations.map((location) => (
          <calcite-list-item
            key={location.id}
            value={location.id}
            label={location.name}
            description={location.place}
            selected={selected.id === location.id}
            oncalciteListItemSelect={(event) => {
              if (event.currentTarget.selected) {
                setSelected(location);
              }
            }}
          />
        ))}
      </calcite-list>
      <div className="panel-content">
        <section className="panel-section">
          <h2>{selected.name}</h2>
          <p className="muted">{selected.place} · NASA</p>
        </section>
        <calcite-button
          width="full"
          onClick={() => {
            void view.goTo(selected.camera).catch((error: unknown) => {
              if (!isAbortError(error)) {
                onError(error);
              }
            });
          }}
        >
          Go to location
        </calcite-button>
      </div>
    </>
  );
}
