export enum GameSpeed {
  Paused = "paused",
  Slow = "slow",
  Medium = "medium",
  Fast = "fast",
}

export enum TileZoneType {
  Unassigned = "unassigned",
  Dock = "dock",
  Travel = "travel",
  StandardStorage = "standard-storage",
  BulkStorage = "bulk-storage",
  FastTurnStorage = "fast-turn-storage",
  OversizeStorage = "oversize-storage",
  SpecialHandlingStorage = "special-handling-storage",
}

export enum LaborRole {
  SwitchDriver = "switch-driver",
  Unload = "unload",
  Storage = "storage",
  Pick = "pick",
  Load = "load",
  Sanitation = "sanitation",
  Management = "management",
}

export enum FreightClass {
  Standard = "standard",
  FastTurn = "fast-turn",
  Bulk = "bulk",
  Oversize = "oversize",
  SpecialHandling = "special-handling",
}
