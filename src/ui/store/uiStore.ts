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
  isLaborDialogOpen: boolean;
  setActiveTool: (tool: ActiveTool) => void;
  setHoveredTile: (tile: TileSummary | null) => void;
  setSelectedTile: (tile: TileSummary | null) => void;
  setLaborDialogOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTool: "select",
  hoveredTile: null,
  selectedTile: null,
  isLaborDialogOpen: false,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setHoveredTile: (tile) => set({ hoveredTile: tile }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
  setLaborDialogOpen: (isOpen) => set({ isLaborDialogOpen: isOpen }),
}));
