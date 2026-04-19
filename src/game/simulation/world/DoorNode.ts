export interface DoorNode {
  id: string;
  x: number;
  y: number;
  mode: "inbound" | "outbound" | "flex";
  trailerId: string | null;
  state: "idle" | "reserved" | "occupied" | "unloading";
}
