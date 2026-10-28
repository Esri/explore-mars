import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import Camera from "@arcgis/core/Camera";
import { useScene } from "../application/SceneContext";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";

const locations = [
  {
    id: "perseverance",
    name: "Perseverance Rover",
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
    name: "Curiosity Rover",
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
    name: "Opportunity Rover",
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

export function LocationPage() {
  const { view, reportError } = useScene();
  const hash = useLocation({ select: (location) => location.hash });
  const navigate = useNavigate();
  const selected = locations.find((location) => location.id === hash);
  const animatedLocation = useRef<string | null>(null);

  const goToLocation = (camera: Camera) => {
    void view.goTo(camera).catch(reportError);
  };

  useEffect(() => {
    if (selected && selected.id !== animatedLocation.current) {
      view.animation?.stop();
      view.camera = selected.camera.clone();
    }
    animatedLocation.current = null;
  }, [view, selected]);

  return (
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
          selected={selected?.id === location.id}
          oncalciteListItemSelect={(event) => {
            if (event.currentTarget.selected) {
              goToLocation(location.camera);
              if (selected !== location) {
                animatedLocation.current = location.id;
                void navigate({
                  to: "/locations",
                  hash: location.id,
                  hashScrollIntoView: false,
                }).catch((error: unknown) => {
                  animatedLocation.current = null;
                  reportError(error);
                });
              }
            }
          }}
        />
      ))}
    </calcite-list>
  );
}
