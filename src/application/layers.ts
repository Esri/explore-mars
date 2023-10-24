import Basemap from "@arcgis/core/Basemap";
import { SpatialReference } from "@arcgis/core/geometry";
import ElevationLayer from "@arcgis/core/layers/ElevationLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";

// const wgs84SR = SpatialReference.WGS84;
export const marsSR = new SpatialReference({ wkid: 104971 });

export const marsElevation = new ElevationLayer({
  id: "marsElevation",
  title: "marsElevation",
  url: "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer",
  copyright:
    "NASA, ESA, HRSC, Goddard Space Flight Center, USGS Astrogeology Science Center, Esri",
});

export const marsHiRiseImagery = new TileLayer({
  id: "marsHiRiseImagery",
  portalItem: {
    id: "c1c4c750a2154842ae523c984cc14fa5",
  },
  title: "Mars HiRise - Imagery service",
  // minScale: 30000,
  opacity: 1,
  visible: false,
});

export const marsReconnaissanceImagery = new TileLayer({
  id: "marsReconnaissanceImagery",
  portalItem: {
    id: "e6c448d134404fc082c73678accca7e5",
  },
  title: "Mars Reconnaissance Imagery",
  // minScale: 400000,
  opacity: 0.8,
  visible: false,
});

export const marsImagery = new TileLayer({
  id: "marsImagery",
  portalItem: {
    id: "1efb16809db84f0c892b9b0662dab0c8",
  },
  title: "Mars Imagery",
  copyright: "USGS Astrogeology Science Center, NASA, JPL, Esri",
  // maxScale: 200000,
  opacity: 1,
});

export const marsImageryBasemap = new Basemap({
  id: "marsImageryBasemap",
  title: "marsImageryBasemap",
  thumbnailUrl:
    "https://www.arcgis.com/sharing/rest/content/items/1efb16809db84f0c892b9b0662dab0c8/info/thumbnail/thumbnail1552849034608.png",
  baseLayers: [marsImagery, marsReconnaissanceImagery, marsHiRiseImagery],
});

const shadedReliefLayer = new TileLayer({
  id: "shadedReliefLayer",
  portalItem: {
    id: "07b33bb3067747abbebd1ce34c29816e",
  },
  copyright: "USGS Astrogeology Science Center, NASA, JPL, ESA, DLR, Esri",
  title: "Shaded relief",
});

export const shadedReliefBasemap = new Basemap({
  id: "shadedReliefBasemap",
  thumbnailUrl:
    "https://www.arcgis.com/sharing/rest/content/items/07b33bb3067747abbebd1ce34c29816e/info/thumbnail/thumbnail1552722865064.png",
  baseLayers: [shadedReliefLayer],
});
