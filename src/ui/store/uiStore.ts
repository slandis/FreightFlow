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
  | "workforce"
  | "condition"
  | "satisfaction"
  | "budgeting"
  | "productivity";

export interface TileSummary {
  x: number;
  y: number;
  zoneType: TileZoneType;
  zoneId: string | null;
  isDockEdge: boolean;
  validForStorage: boolean;
  invalidReason: string | null;
  nearestTravelDistance: number | null;
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
  activePlanningPage: PlanningPage;
  setActiveTool: (tool: ActiveTool) => void;
  setHoveredTile: (tile: TileSummary | null) => void;
  setSelectedTile: (tile: TileSummary | null) => void;
  setLaborDialogOpen: (isOpen: boolean) => void;
  setActivePlanningPage: (page: PlanningPage) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTool: "select",
  hoveredTile: null,
  selectedTile: null,
  isLaborDialogOpen: false,
  activePlanningPage: "forecast",
  setActiveTool: (tool) => set({ activeTool: tool }),
  setHoveredTile: (tile) => set({ hoveredTile: tile }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
  setLaborDialogOpen: (isOpen) => set({ isLaborDialogOpen: isOpen }),
  setActivePlanningPage: (page) => set({ activePlanningPage: page }),
}));
