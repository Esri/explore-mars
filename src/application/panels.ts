export const panels = {
  locations: {
    to: "/locations",
    label: "Locations",
    icon: "map-pin",
  },
  measure: {
    to: "/measure",
    label: "Measure",
    icon: "measure",
  },
  compare: {
    to: "/compare",
    label: "Compare",
    icon: "compare",
  },
  layers: {
    to: "/layers",
    label: "Layers",
    icon: "layers",
  },
  about: {
    to: "/about",
    label: "About Explore Mars",
    icon: "information",
  },
} as const;

export const measurementTools = {
  line: { to: "/measure/line", label: "Line" },
  area: { to: "/measure/area", label: "Area" },
  elevation: { to: "/measure/elevation", label: "Elevation" },
} as const;

export const comparisonModes = {
  models: { to: "/compare/models", label: "3D models" },
  regions: { to: "/compare/regions", label: "Earth regions" },
} as const;
