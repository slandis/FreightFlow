export interface Trailer {
  id: string;
  contractId: string | null;
  direction: "inbound" | "outbound";
  state:
    | "yard"
    | "switching-to-door"
    | "at-door"
    | "unloading"
    | "unloaded"
    | "loading"
    | "complete";
  doorId: string | null;
  freightBatchIds: string[];
  arrivalTick: number;
  doorAssignedTick: number | null;
  unloadStartedTick: number | null;
  completedTick: number | null;
  remainingSwitchTicks: number;
  remainingUnloadCubicFeet: number;
  remainingLoadCubicFeet: number;
  dockTileIndex: number | null;
}
