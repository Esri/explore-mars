/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Basemap from "@arcgis/core/Basemap";
import { SpatialReference } from "@arcgis/core/geometry";
import ElevationLayer from "@arcgis/core/layers/ElevationLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
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

export const marsNamesLayer = new GroupLayer({
  layers: [
    new FeatureLayer({
      title: "Mars Nomenclature Mons",
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Mars_Nomenclature_Mountains/FeatureServer/7",
      popupEnabled: false,
      minScale: 15000000,
      maxScale: 0,
      definitionExpression: "clean_name LIKE '%mons%' AND diameter >= 100",
      labelingInfo: [
        {
          labelExpression: "[name]",
          symbol: {
            type: "text",
            color: [214, 129, 129, 1],
            font: {
              family: "Avenir Next LT Pro Demi",
              size: 11.25,
              style: "italic",
            },
            kerning: true,
            haloSize: 0.75,
            haloColor: [0, 0, 0, 255],
          },
        },
      ],
      renderer: {
        // @ts-expect-error type is a valid property
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [255, 255, 255, 0],
          outline: { color: [255, 255, 255, 0] },
        },
      },
      labelsVisible: true,
      elevationInfo: { mode: "on-the-ground" },
    }),
    new FeatureLayer({
      title: "Mars Nomenclature Craters",
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Mars_Nomenclature_Mountains/FeatureServer/7",
      popupEnabled: false,
      minScale: 5200000,
      maxScale: 0,
      definitionExpression: "type = 'Crater, craters' AND diameter >= 45",
      labelingInfo: [
        {
          labelExpression: "[name]",
          labelExpressionInfo: { expression: '$feature["name"] + " crater"' },
          symbol: {
            type: "text",
            color: [189, 189, 189, 1],
            font: {
              family: "Arial",
              size: 11.25,
              style: "italic",
              weight: "bold",
            },
            kerning: true,
            haloSize: 0.75,
            haloColor: [105, 105, 105, 1],
          },
        },
      ],
      renderer: {
        // @ts-expect-error type is a valid property
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [255, 255, 255, 0],
          outline: { color: [255, 255, 255, 0] },
        },
      },
      labelsVisible: true,
      elevationInfo: { mode: "on-the-ground" },
    }),
    new FeatureLayer({
      title: "Mars Nomenclature Planitia and Vallis",
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Mars_Nomenclature_Mountains/FeatureServer/7",
      popupEnabled: false,
      minScale: 30000000,
      maxScale: 0,
      definitionExpression:
        "type = 'Planitia, planitiae' OR ((type = 'Vallis, valles') AND (diameter >= 700))",
      labelingInfo: [
        {
          labelExpression: "[name]",
          symbol: {
            type: "text",
            color: [255, 242, 209, 0.5],
            font: { family: "Avenir Next LT Pro", size: 12, style: "italic" },
            kerning: true,
            haloSize: 0.75,
          },
        },
      ],
      renderer: {
        // @ts-expect-error type is a valid property
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [255, 255, 255, 0],
          outline: { color: [255, 255, 255, 0] },
        },
      },
      labelsVisible: true,
    }),
  ],
});

export const missionLayer = new FeatureLayer({
  portalItem: { id: "be651e0ceb6941b3949d0f68e0169642" },
  elevationInfo: {
    mode: "on-the-ground",
  },
  labelingInfo: [
    {
      labelExpressionInfo: {
        expression: "$feature.NAME + ' (' + $feature.landed + ')'",
      },
      symbol: {
        type: "label-3d",
        symbolLayers: [
          {
            type: "text",
            material: {
              color: "white",
            },
            size: 12,
          } as any,
        ],
        callout: {
          type: "line",
          size: 1.5,
          color: [200, 200, 200],
          border: null,
        },
        verticalOffset: {
          screenLength: 25,
          maxWorldLength: 150000,
          minWorldLength: 20,
        },
      },
      labelPlacement: "above-center",
      maxScale: 0,
      minScale: 0,
    },
  ],

  renderer: {
    // @ts-expect-error type is a valid property
    type: "simple",
    symbol: {
      type: "point-3d",

      symbolLayers: [
        {
          type: "icon",
          size: 15,
          material: {
            color: [255, 255, 255, 0.1],
          },
          outline: {
            color: "white",
            size: "1px",
          },
          resource: {
            primitive: "circle",
          },
        },
      ],
    },
  },
  popupEnabled: false,
  maxScale: 0,
  minScale: 0,
  // maxScale: 500000
});
