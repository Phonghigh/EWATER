import { create } from "zustand";
import type { LayerKey, Selection, TraceResult } from "../types";

interface AppState {
  layers: Record<LayerKey, boolean>;
  basemap: string;
  simMode: boolean;
  simStep: number;
  playing: boolean;
  speed: number; // steps per second
  selection: Selection | null;
  trace: TraceResult | null;
  currentStep: number; // shared "now" cursor for Dashboard/Monitor/Report
  selectedStation: string | null;
  toggleLayer: (k: LayerKey) => void;
  setBasemap: (b: string) => void;
  setSimMode: (v: boolean) => void;
  setSimStep: (s: number) => void;
  setPlaying: (v: boolean) => void;
  setSpeed: (v: number) => void;
  setSelection: (s: Selection | null) => void;
  setTrace: (t: TraceResult | null) => void;
  setCurrentStep: (s: number) => void;
  setSelectedStation: (id: string | null) => void;
}

/** Default "now" cursor - mid-storm so tables/dashboard show live activity. */
export const DEFAULT_STEP = 40;

export const useStore = create<AppState>((set) => ({
  layers: {
    manholes: true,
    links: true,
    outlets: true,
    rivers: true,
    boundary: true,
    catchment: false,
    flood: true,
  },
  basemap: "osm",
  simMode: false,
  simStep: 0,
  playing: false,
  speed: 4,
  selection: null,
  trace: null,
  currentStep: DEFAULT_STEP,
  selectedStation: null,
  toggleLayer: (k) =>
    set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setBasemap: (basemap) => set({ basemap }),
  setSimMode: (simMode) => set({ simMode, playing: false }),
  setSimStep: (simStep) => set({ simStep }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setSelection: (selection) => set({ selection, trace: null }),
  setTrace: (trace) => set({ trace }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setSelectedStation: (selectedStation) => set({ selectedStation }),
}));
