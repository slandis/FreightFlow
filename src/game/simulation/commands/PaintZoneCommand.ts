import { TileZoneType } from "../types/enums";
import {
  estimatePaintSelectionCost,
  formatCurrencyAmount,
  trySpendCapitalCost,
} from "../economy/buildCosts";
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
    if (context.state.planning.isPlanningActive) {
      return commandFailed("Zone editing is locked during monthly planning");
    }

    if (!Object.values(TileZoneType).includes(this.zoneType)) {
      return commandFailed(`Invalid zone type: ${this.zoneType}`);
    }

    if (this.zoneType === TileZoneType.Dock) {
      return commandFailed("Dock zones are reserved for protected edge tiles");
    }

    const estimate = estimatePaintSelectionCost(
      context.state.warehouseMap,
      [{ x: this.x, y: this.y }],
      this.zoneType,
    );

    if (estimate.changedTileCount === 0) {
      return commandSucceeded();
    }

    if (!trySpendCapitalCost(context.state, estimate.cost)) {
      return commandFailed(
        `Not enough cash to assign 1 tile (${formatCurrencyAmount(estimate.cost)})`,
      );
    }

    context.state.warehouseMap.paintTile(this.x, this.y, this.zoneType);

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
