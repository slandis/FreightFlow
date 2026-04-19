import { create } from "zustand";
import { TileZoneType } from "../../game/simulation/types/enums";

export type ActiveTool =
  | "select"
  | "erase"
  | Exclude<TileZoneType, TileZoneType.Dock | TileZoneType.Unassigned>;

export interface TileSummary {
  x: number;
  y: number;
  zoneType: TileZoneType;
  zoneId: string | null;
  isDockEdge: boolean;
  validForStorage: boolean;
  invalidReason: string | null;
  nearestTravelDistance: number | null;
}

interface UiState {
  activeTool: ActiveTool;
  hoveredTile: TileSummary | null;
  selectedTile: TileSummary | null;
  setActiveTool: (tool: ActiveTool) => void;
  setHoveredTile: (tile: TileSummary | null) => void;
  setSelectedTile: (tile: TileSummary | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTool: "select",
  hoveredTile: null,
  selectedTile: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setHoveredTile: (tile) => set({ hoveredTile: tile }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
}));
