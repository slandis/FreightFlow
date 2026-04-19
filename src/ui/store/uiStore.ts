import { create } from "zustand";
import type { TileZoneType } from "../../game/simulation/types/enums";

interface TileSummary {
  x: number;
  y: number;
  zoneType: TileZoneType;
  isDockEdge: boolean;
}

interface UiState {
  activeTool: string;
  hoveredTile: TileSummary | null;
  selectedTile: TileSummary | null;
  setActiveTool: (tool: string) => void;
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
