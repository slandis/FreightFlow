import { TileZoneType } from "../types/enums";
import { isStorageZoneType } from "../world/ZoneManager";
import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";

export class PaintZoneCommand implements Command<"paint-zone"> {
  readonly type = "paint-zone";

  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly zoneType: TileZoneType,
  ) {}

  execute(context: CommandContext) {
    if (!Object.values(TileZoneType).includes(this.zoneType)) {
      return commandFailed(`Invalid zone type: ${this.zoneType}`);
    }

    if (this.zoneType === TileZoneType.Dock) {
      return commandFailed("Dock zones are reserved for protected edge tiles");
    }

    const changed = context.state.warehouseMap.paintTile(this.x, this.y, this.zoneType);

    if (!changed) {
      return commandSucceeded();
    }

    const events = context.state.warehouseMap.zones
      .filter((zone) => isStorageZoneType(zone.zoneType) && !zone.validForStorage)
      .map((zone) => ({
        ...context.createEvent("zone-invalidated"),
        zoneId: zone.id,
        zoneType: zone.zoneType,
        reason: zone.invalidReason ?? "Storage zone is invalid",
      }));

    return commandSucceeded(events);
  }
}
