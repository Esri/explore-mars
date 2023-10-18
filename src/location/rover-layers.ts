import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";

const MIN_SCALE_PATHS = 3000000;
const MIN_SCALE_WAYPOINTS = 100000;

const RENDERER_WAYPOINTS: any = {
  type: "simple",
  symbol: {
    type: "point-3d",

    symbolLayers: [
      {
        type: "icon",
        size: 6,
        material: {
          color: [255, 255, 255],
        },
        outline: {
          color: "gray",
          size: "1px",
        },
        resource: {
          primitive: "circle",
        },
      },
    ],
  },
};

const RENDERER_PATHS: any = {
  type: "simple",
  symbol: {
    type: "line-3d",

    symbolLayers: [
      {
        type: "line",
        join: "bevel",
        size: 2,
        material: {
          color: [255, 255, 255, 0.75],
        },
        outline: {
          color: "black",
          size: "1px",
        },
      },
    ],
  },
};

// Unused layers
//   url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/mars2020_waypoints/MapServer/0",
//   url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/mars2020_2/MapServer/0",
//   url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/mars2020/MapServer/0",

export const createPerseveranceLayers = () => {
  return new GroupLayer({
    id: "createPerseveranceLayers",
    title: "Perseverance 2021",
    visible: true,
    layers: [
      new GeoJSONLayer({
        id: "createPerseveranceLayers1",
        title: "Perseverance Waypoints",
        url: "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints_current.json",
        copyright: "NASA",
        renderer: RENDERER_WAYPOINTS,
        minScale: MIN_SCALE_WAYPOINTS,
      }),
      new FeatureLayer({
        id: "createPerseveranceLayers2",
        url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/perseverance_landing_ellipse/MapServer/0",
        title: "Perseverance target landing area",
        popupEnabled: true,
        popupTemplate: {
          content: [
            {
              type: "media",
              mediaInfos: [
                {
                  altText: "",
                  caption: "Jezero Crater's Ancient Lakeshore",
                  title: "Perseverance target landing area",
                  type: "image",
                  refreshInterval: 0,
                  value: {
                    linkURL: "",
                    sourceURL:
                      "https://mars.nasa.gov/system/resources/detail_files/24681_PIA23511-web.jpg",
                  },
                },
              ],
            },
            {
              type: "text",
              text: '<p>Lighter colors represent higher elevation in this image of Jezero Crater on Mars, the landing site for NASA\'s Mars 2020 mission. The oval indicates the landing ellipse, where the rover will be touching down on Mars. The color added to this image helps the crater rim stand out clearly, and makes it easier to spot the shoreline of a lake that dried up billions of years ago.</p><p>Scientists want to visit this shoreline because it may have preserved fossilized microbial life, if any ever formed on Mars.</p><p><span style="font-size:14px;">Source: </span><a target="_blank" rel="noopener noreferrer" href="https://mars.nasa.gov/resources/24681/jezero-craters-ancient-lakeshore/"><span style="font-size:14px;">https://mars.nasa.gov/resources/24681/jezero-craters-ancient-lakeshore/</span></a></p>',
            },
          ],
          title: "Perseverance target landing area",
        },
        renderer: {
          type: "simple",
          symbol: {
            type: "polygon-3d",
            symbolLayers: [
              {
                type: "fill",
                material: {
                  color: [20, 20, 20, 0.1],
                },
                outline: { color: [20, 20, 20, 0.75], size: 2 },
              },
            ],
          },
        },
        minScale: MIN_SCALE_PATHS,
        maxScale: 10000,
      }),
    ],
  });
};

// unused layers
//   url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/curiosity_path/MapServer/0",
//   url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/curiosity_waypoints/MapServer/0",

export const createCuriosityLayers = () =>
  new GroupLayer({
    id: "createCuriosityLayers",
    title: "Curiosity 2012",
    visible: true,
    layers: [
      new GeoJSONLayer({
        id: "createCuriosityLayers1",
        title: "Curiosity Waypoints",
        url: "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json",
        copyright: "NASA",
        renderer: RENDERER_WAYPOINTS,
        minScale: MIN_SCALE_WAYPOINTS,
        featureReduction: { type: "selection" },
        screenSizePerspectiveEnabled: true,
      }),
      new GeoJSONLayer({
        id: "createCuriosityLayers2",
        title: "Curiosity Path",
        url: "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json",
        copyright: "NASA",
        renderer: RENDERER_PATHS,
        minScale: MIN_SCALE_PATHS,
        elevationInfo: { mode: "on-the-ground" },
      }),
    ],
  });

// unused layers
//   url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/opportunity_path2/MapServer/0",
//   url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/opportunity_path3/MapServer/0",
export const createOpportunityLayers = () =>
  new GroupLayer({
    id: "createOpportunityLayers",
    title: "Opportuntiy 2004",
    visible: true,
    layers: [
      new FeatureLayer({
        id: "createOpportunityLayers1",
        url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/opportunity_path/MapServer/0",
        outFields: ["*"],
        renderer: RENDERER_PATHS,
        minScale: MIN_SCALE_PATHS,
      }),
      new FeatureLayer({
        id: "createOpportunityLayers2",
        url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/opportunity_waypoints/MapServer/0",
        outFields: ["*"],
        renderer: RENDERER_WAYPOINTS,
        minScale: MIN_SCALE_WAYPOINTS,
        elevationInfo: {
          mode: "relative-to-ground",
          featureExpressionInfo: {
            expression: "0",
          },
        },
      }),
    ],
  });

export const createMissionLayer = () =>
  new FeatureLayer({
    id: "createMissionLayer",
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
  });
  

export const createMarsNamesLayer = () =>
  new GroupLayer({
    id: "createMarsNamesLayer",
    layers: [
      new FeatureLayer({
        id: "createMarsNamesLayer1",
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
        id: "createMarsNamesLayer2",
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
        id: "createMarsNamesLayer3",
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