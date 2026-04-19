export interface Trailer {
  id: string;
  direction: "inbound" | "outbound";
  state: "yard" | "door" | "unloading" | "loading" | "complete";
}
