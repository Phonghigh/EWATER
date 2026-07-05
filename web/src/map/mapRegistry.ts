import type { Map as MLMap } from "maplibre-gl";

/** Module-level handle so panels outside MapView can drive the map (flyTo etc.). */
export const mapRegistry: { current: MLMap | null } = { current: null };
