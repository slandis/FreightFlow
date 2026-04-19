import { create } from "zustand";

interface UiState {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
