import { create } from "zustand";
import { TileZoneType } from "../../game/simulation/types/enums";

export type ActiveTool =
  | "select"
  | "erase"
  | "door-flex"
  | "door-inbound"
  | "door-outbound"
  | "door-remove"
  | Exclude<TileZoneType, TileZoneType.Dock | TileZoneType.Unassigned>;

export type PlanningPage =
  | "forecast"
  | "contracts"
  | "workforce"
  | "condition"
  | "satisfaction"
  | "budgeting"
  | "productivity";

export type OverlayMode =
  | "invalid-storage"
  | "zone-types"
  | "travel-network"
  | "storage-capacity"
  | "door-utilization"
  | "queue-pressure"
  | "none";

export type MapOrientation = 0 | 1 | 2 | 3;

export interface MapFocusRequest {
  id: string;
  reason: string;
  x: number;
  y: number;
  zoom?: number;
}

export interface TileSummary {
  x: number;
  y: number;
  zoneType: TileZoneType;
  zoneId: string | null;
  isDockEdge: boolean;
  validForStorage: boolean;
  invalidReason: string | null;
  nearestTravelDistance: number | null;
  nearestDoorDistance: number | null;
  isActiveDoor: boolean;
  doorId: string | null;
  doorMode: string | null;
  doorState: string | null;
}

interface UiState {
  activeTool: ActiveTool;
  hoveredTile: TileSummary | null;
  selectedTile: TileSummary | null;
  isLaborDialogOpen: boolean;
  isSaveLoadDialogOpen: boolean;
  saveLoadMessage: string | null;
  activePlanningPage: PlanningPage;
  activeOverlayMode: OverlayMode;
  mapOrientation: MapOrientation;
  mapFocusRequest: MapFocusRequest | null;
  setActiveTool: (tool: ActiveTool) => void;
  setHoveredTile: (tile: TileSummary | null) => void;
  setSelectedTile: (tile: TileSummary | null) => void;
  setLaborDialogOpen: (isOpen: boolean) => void;
  setSaveLoadDialogOpen: (isOpen: boolean) => void;
  setSaveLoadMessage: (message: string | null) => void;
  setActivePlanningPage: (page: PlanningPage) => void;
  setActiveOverlayMode: (mode: OverlayMode) => void;
  rotateMapClockwise: () => void;
  rotateMapCounterClockwise: () => void;
  requestMapFocus: (request: Omit<MapFocusRequest, "id">) => void;
  clearMapFocusRequest: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTool: "select",
  hoveredTile: null,
  selectedTile: null,
  isLaborDialogOpen: false,
  isSaveLoadDialogOpen: false,
  saveLoadMessage: null,
  activePlanningPage: "forecast",
  activeOverlayMode: "invalid-storage",
  mapOrientation: 0,
  mapFocusRequest: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setHoveredTile: (tile) => set({ hoveredTile: tile }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
  setLaborDialogOpen: (isOpen) => set({ isLaborDialogOpen: isOpen }),
  setSaveLoadDialogOpen: (isOpen) => set({ isSaveLoadDialogOpen: isOpen }),
  setSaveLoadMessage: (message) => set({ saveLoadMessage: message }),
  setActivePlanningPage: (page) => set({ activePlanningPage: page }),
  setActiveOverlayMode: (mode) => set({ activeOverlayMode: mode }),
  rotateMapClockwise: () =>
    set((state) => ({ mapOrientation: ((state.mapOrientation + 1) % 4) as MapOrientation })),
  rotateMapCounterClockwise: () =>
    set((state) => ({ mapOrientation: ((state.mapOrientation + 3) % 4) as MapOrientation })),
  requestMapFocus: (request) =>
    set({
      mapFocusRequest: {
        ...request,
        id: `focus-${Date.now()}-${request.x}-${request.y}`,
      },
    }),
  clearMapFocusRequest: (id) =>
    set((state) => ({
      mapFocusRequest: state.mapFocusRequest?.id === id ? null : state.mapFocusRequest,
    })),
}));
