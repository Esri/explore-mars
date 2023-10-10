import Basemap from "@arcgis/core/Basemap";
import Camera from "@arcgis/core/Camera";
import { SpatialReference } from "@arcgis/core/geometry";
import ElevationLayer from "@arcgis/core/layers/ElevationLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";

// const wgs84SR = SpatialReference.WGS84;
export const marsSR = new SpatialReference({ wkid: 104971 });

const MIN_SCALE_PATHS = 3000000;
const MIN_SCALE_WAYPOINTS = 100000;

export const marsElevation = new ElevationLayer({
  url: "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer",
  copyright:
    "NASA, ESA, HRSC, Goddard Space Flight Center, USGS Astrogeology Science Center, Esri",
});

export const marsHiRiseImagery = new TileLayer({
  portalItem: {
    id: "c1c4c750a2154842ae523c984cc14fa5",
  },
  title: "Mars HiRise - Imagery service",
  // minScale: 30000,
  opacity: 1,
  visible: false,
});

export const marsReconnaissanceImagery = new TileLayer({
  portalItem: {
    id: "e6c448d134404fc082c73678accca7e5",
  },
  title: "Mars Reconnaissance Imagery",
  // minScale: 400000,
  opacity: 0.8,
  visible: false,
});

export const marsImagery = new TileLayer({
  portalItem: {
    id: "1efb16809db84f0c892b9b0662dab0c8",
  },
  title: "Mars Imagery",
  copyright: "USGS Astrogeology Science Center, NASA, JPL, Esri",
  // maxScale: 200000,
  opacity: 1,
});

export const marsImageryBasemap = new Basemap({
  thumbnailUrl:
    "https://www.arcgis.com/sharing/rest/content/items/1efb16809db84f0c892b9b0662dab0c8/info/thumbnail/thumbnail1552849034608.png",
  baseLayers: [marsImagery, marsReconnaissanceImagery, marsHiRiseImagery],
});

const shadedReliefLayer = new TileLayer({
  portalItem: {
    id: "07b33bb3067747abbebd1ce34c29816e",
  },
  copyright: "USGS Astrogeology Science Center, NASA, JPL, ESA, DLR, Esri",
  title: "Shaded relief",
});

export const shadedReliefBasemap = new Basemap({
  thumbnailUrl:
    "https://www.arcgis.com/sharing/rest/content/items/07b33bb3067747abbebd1ce34c29816e/info/thumbnail/thumbnail1552722865064.png",
  baseLayers: [shadedReliefLayer],
});

export const createMarsNamesLayer = () =>
  new GroupLayer({
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
    title: "Perseverance 2021",
    visible: true,
    layers: [
      new GeoJSONLayer({
        title: "Perseverance Waypoints",
        url: "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints_current.json",
        copyright: "NASA",
        renderer: RENDERER_WAYPOINTS,
        minScale: MIN_SCALE_WAYPOINTS,
      }),
      new FeatureLayer({
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
    title: "Curiosity 2012",
    visible: true,
    layers: [
      new GeoJSONLayer({
        title: "Curiosity Waypoints",
        url: "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json",
        copyright: "NASA",
        renderer: RENDERER_WAYPOINTS,
        minScale: MIN_SCALE_WAYPOINTS,
        featureReduction: { type: "selection" },
        screenSizePerspectiveEnabled: true,
      }),
      new GeoJSONLayer({
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
    title: "Opportuntiy 2004",
    visible: true,
    layers: [
      new FeatureLayer({
        url: "https://trek.nasa.gov/mars/trekarcgis/rest/services/opportunity_path/MapServer/0",
        outFields: ["*"],
        renderer: RENDERER_PATHS,
        minScale: MIN_SCALE_PATHS,
      }),
      new FeatureLayer({
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
    // maxScale: 500000
  });

export const tweetLayer = new FeatureLayer({
  // test service  url:"https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Airports_by_scale/FeatureServer/1",
  portalItem: { id: "bfa90941f52c4c519d650dadc3de1b72" },
  outFields: ["*"],
  definitionExpression: "show = 1",
  featureReduction: {
    type: "selection",
  },
  minScale: 25000000,
  screenSizePerspectiveEnabled: true,
  labelingInfo: [
    {
      labelExpressionInfo: {
        expression: "'@' + $feature.twitterUser",
      },
      symbol: {
        type: "text",
        color: "white",
        haloSize: 0.5,
        haloColor: [50, 50, 50, 0.7],
        font: {
          size: 9,
        },
      },
      labelPlacement: "center-right",
      maxScale: 0,
      minScale: 2500000,
    },
  ],
  renderer: {
    type: "simple",
    symbol: {
      type: "point-3d",
      callout: {
        type: "line",
        // autocasts as new LineCallout3D()
        size: 1.5,
        color: [150, 150, 150],
        border: {
          color: [50, 50, 50],
        },
      },
      verticalOffset: {
        screenLength: 40,
        maxWorldLength: 10000,
        minWorldLength: 20,
      },
      symbolLayers: [
        {
          type: "icon",
          size: 20,
          material: {
            color: [255, 255, 255, 0.9],
          },
          resource: {
            href: "/tweet.svg",
          },
        },
      ],
    },
  },
});

export const tweetLayerClientSide = new FeatureLayer({
  spatialReference: { wkid: 104971 },
  geometryType: "point",
  objectIdField: "OBJECTID",
  source: [],
  fields: [
    {
      name: "OBJECTID",
      alias: "OBJECTID",
      type: "oid",
    },
    {
      name: "tweetid",
      alias: "tweetId",
      type: "string",
    },
    {
      name: "urlhash",
      alias: "urlHash",
      type: "string",
    },
  ],
  outFields: ["*"],
  renderer: tweetLayer.renderer.clone(),
});

export const cameras = {
  perseverance: new Camera({
    position: {
      x: 77.31831,
      y: 17.9882,
      z: 7292.077,
      spatialReference: { wkid: 104971 },
    },
    heading: 15.53,
    tilt: 67.5,
  }),
  curiosity: new Camera({
    position: {
      x: 136.90526,
      y: -7.16597,
      z: 62217.981,
      spatialReference: { wkid: 104971 },
    },
    heading: 13.78,
    tilt: 65.46,
  }),
  // opportunity: new Camera({
  //   position: {
  //     x: -5.26261,
  //     y: -2.42335,
  //     z: 1945.698,
  //     spatialReference: { wkid: 104971 }
  //   },
  //   heading: 320.10,
  //   tilt: 71.47
  // })
  opportunity: new Camera({
    position: {
      x: -5.7945,
      y: 0.66213,
      z: 77385.93,
      spatialReference: { wkid: 104971 },
    },
    heading: 173.58,
    tilt: 61.54,
  }),
};
