import { describe, expect, it } from "vitest";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { TileZoneType } from "../../game/simulation/types/enums";

describe("PaintZoneCommand", () => {
  it("paints an interior tile in the authoritative warehouse map", () => {
    const runner = new SimulationRunner();

    const result = runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Travel));

    expect(result.success).toBe(true);
    expect(runner.getState().warehouseMap.getTile(4, 4)?.zoneType).toBe(TileZoneType.Travel);
  });

  it("erases painted interior tiles back to unassigned", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Unassigned));

    expect(runner.getState().warehouseMap.getTile(4, 4)?.zoneType).toBe(
      TileZoneType.Unassigned,
    );
  });

  it("protects dock edge tiles from repainting or erasing", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(0, 0, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(0, 0, TileZoneType.Unassigned));

    expect(runner.getState().warehouseMap.getTile(0, 0)?.zoneType).toBe(TileZoneType.Dock);
  });

  it("repainting overwrites the previous interior assignment", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.BulkStorage));

    expect(runner.getState().warehouseMap.getTile(8, 8)?.zoneType).toBe(
      TileZoneType.BulkStorage,
    );
  });

  it("marks storage without any travel tile as invalid", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));

    const tile = runner.getState().warehouseMap.getTile(8, 8);
    expect(tile?.validForStorage).toBe(false);
    expect(tile?.invalidReason).toBe("No travel access");
  });

  it("marks storage within three tiles of travel as valid", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(8, 5, TileZoneType.StandardStorage));

    const tile = runner.getState().warehouseMap.getTile(8, 5);
    expect(tile?.validForStorage).toBe(true);
    expect(tile?.invalidReason).toBeNull();
    expect(tile?.nearestTravelDistance).toBe(3);
  });

  it("marks storage farther than three tiles from travel as invalid", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(2, 2, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));

    const tile = runner.getState().warehouseMap.getTile(8, 8);
    expect(tile?.validForStorage).toBe(false);
    expect(tile?.invalidReason).toBe("Too far from travel tile");
  });

  it("aggregates contiguous same-type zones and separates different types", () => {
    const runner = new SimulationRunner();
    const map = runner.getState().warehouseMap;

    runner.dispatch(new PaintZoneCommand(3, 3, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(3, 4, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.BulkStorage));

    const standardZones = map.zones.filter(
      (zone) => zone.zoneType === TileZoneType.StandardStorage,
    );
    const bulkZones = map.zones.filter((zone) => zone.zoneType === TileZoneType.BulkStorage);

    expect(standardZones).toHaveLength(1);
    expect(standardZones[0].tileIndexes).toHaveLength(2);
    expect(standardZones[0].capacityCubicFeet).toBe(1100);
    expect(bulkZones).toHaveLength(1);
    expect(bulkZones[0].tileIndexes).toHaveLength(1);
    expect(bulkZones[0].capacityCubicFeet).toBe(900);
  });

  it("updates command and invalidation event debug metadata", () => {
    const runner = new SimulationRunner();
    const eventTypes: string[] = [];

    runner.getEventBus().subscribe("zone-invalidated", (event) => eventTypes.push(event.type));
    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));

    expect(runner.getState().debug.lastCommandType).toBe("paint-zone");
    expect(runner.getState().debug.lastEventType).toBe("zone-invalidated");
    expect(eventTypes).toEqual(["zone-invalidated"]);
  });
});
