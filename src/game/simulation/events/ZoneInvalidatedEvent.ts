import type { TileZoneType } from "../types/enums";
import type { DomainEvent } from "./DomainEvent";

export interface ZoneInvalidatedEvent extends DomainEvent {
  type: "zone-invalidated";
  zoneId: string;
  zoneType: TileZoneType;
  reason: string;
}
