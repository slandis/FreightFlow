import { describe, expect, it } from "vitest";
import {
  getEraseCost,
  getZonePaintCost,
} from "../../game/simulation/economy/buildCosts";
import { PaintZoneAreaCommand } from "../../game/simulation/commands/PaintZoneAreaCommand";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { PlaceDoorCommand } from "../../game/simulation/commands/PlaceDoorCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { TileZoneType } from "../../game/simulation/types/enums";

describe("PaintZoneCommand", () => {
  it("paints an interior tile in the authoritative warehouse map", () => {
    const runner = new SimulationRunner();
    const startingCash = runner.getState().cash;

    const result = runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Travel));

    expect(result.success).toBe(true);
    expect(runner.getState().warehouseMap.getTile(4, 4)?.zoneType).toBe(TileZoneType.Travel);
    expect(runner.getState().cash).toBe(startingCash - getZonePaintCost(TileZoneType.Travel));
    expect(runner.getState().economy.currentMonthCapitalCost).toBe(
      getZonePaintCost(TileZoneType.Travel),
    );
  });

  it("erases painted interior tiles back to unassigned", () => {
    const runner = new SimulationRunner();
    const startingCash = runner.getState().cash;

    runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Unassigned));

    expect(runner.getState().warehouseMap.getTile(4, 4)?.zoneType).toBe(
      TileZoneType.Unassigned,
    );
    expect(runner.getState().cash).toBe(
      startingCash -
        getZonePaintCost(TileZoneType.Travel) -
        getEraseCost(),
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
    const startingCash = runner.getState().cash;

    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.BulkStorage));

    expect(runner.getState().warehouseMap.getTile(8, 8)?.zoneType).toBe(
      TileZoneType.BulkStorage,
    );
    expect(runner.getState().cash).toBe(
      startingCash -
        getZonePaintCost(TileZoneType.StandardStorage) -
        getZonePaintCost(TileZoneType.BulkStorage),
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

  it("marks stage without a touching door tile as invalid", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    runner.dispatch(new PaintZoneCommand(4, 2, TileZoneType.Stage));

    const tile = runner.getState().warehouseMap.getTile(4, 2);
    expect(tile?.validForStorage).toBe(false);
    expect(tile?.invalidReason).toBe("No door access");
  });

  it("treats a contiguous stage area as valid when any tile touches a door", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    runner.dispatch(new PaintZoneCommand(4, 1, TileZoneType.Stage));
    runner.dispatch(new PaintZoneCommand(4, 2, TileZoneType.Stage));
    runner.dispatch(new PaintZoneCommand(4, 3, TileZoneType.Stage));

    const farTile = runner.getState().warehouseMap.getTile(4, 3);
    const zone = runner
      .getState()
      .warehouseMap.zones.find((candidateZone) => candidateZone.id === farTile?.zoneId);

    expect(farTile?.nearestDoorDistance).toBe(3);
    expect(farTile?.validForStorage).toBe(true);
    expect(farTile?.invalidReason).toBeNull();
    expect(zone?.validForStorage).toBe(true);
    expect(zone?.invalidReason).toBeNull();
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

  it("paints a multi-tile area with one authoritative command", () => {
    const runner = new SimulationRunner();
    const startingCash = runner.getState().cash;

    const result = runner.dispatch(
      new PaintZoneAreaCommand(
        [
          { x: 4, y: 4 },
          { x: 5, y: 4 },
          { x: 4, y: 5 },
          { x: 5, y: 5 },
        ],
        TileZoneType.Travel,
      ),
    );

    expect(result.success).toBe(true);
    expect(runner.getState().warehouseMap.getTile(4, 4)?.zoneType).toBe(TileZoneType.Travel);
    expect(runner.getState().warehouseMap.getTile(5, 4)?.zoneType).toBe(TileZoneType.Travel);
    expect(runner.getState().warehouseMap.getTile(4, 5)?.zoneType).toBe(TileZoneType.Travel);
    expect(runner.getState().warehouseMap.getTile(5, 5)?.zoneType).toBe(TileZoneType.Travel);
    expect(runner.getState().cash).toBe(
      startingCash - getZonePaintCost(TileZoneType.Travel) * 4,
    );
  });

  it("keeps dock edge tiles protected during area painting", () => {
    const runner = new SimulationRunner();
    const startingCash = runner.getState().cash;

    runner.dispatch(
      new PaintZoneAreaCommand(
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        TileZoneType.Travel,
      ),
    );

    expect(runner.getState().warehouseMap.getTile(0, 0)?.zoneType).toBe(TileZoneType.Dock);
    expect(runner.getState().warehouseMap.getTile(1, 1)?.zoneType).toBe(TileZoneType.Travel);
    expect(runner.getState().cash).toBe(
      startingCash - getZonePaintCost(TileZoneType.Travel),
    );
  });

  it("charges area paint only for tiles that actually change", () => {
    const runner = new SimulationRunner();
    const startingCash = runner.getState().cash;

    runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Travel));
    runner.dispatch(
      new PaintZoneAreaCommand(
        [
          { x: 4, y: 4 },
          { x: 4, y: 4 },
          { x: 5, y: 5 },
        ],
        TileZoneType.Travel,
      ),
    );

    expect(runner.getState().cash).toBe(
      startingCash - getZonePaintCost(TileZoneType.Travel) * 2,
    );
  });

  it("fails loudly when the player cannot afford the edit", () => {
    const runner = new SimulationRunner({ startingCash: 25 });

    const result = runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.StandardStorage));

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(["Not enough cash to assign 1 tile ($120)"]);
    expect(runner.getState().warehouseMap.getTile(4, 4)?.zoneType).toBe(TileZoneType.Unassigned);
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

  it("preserves stored zone usage when unrelated painting rebuilds zones while paused", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(7, 5, TileZoneType.StandardStorage));
    const initialStorageZone = state.warehouseMap.zones.find(
      (zone) => zone.zoneType === TileZoneType.StandardStorage,
    );

    state.freightFlow.freightBatches.push({
      id: "stored-batch",
      trailerId: "trailer-1",
      contractId: "baseline-general-freight",
      freightClassId: "standard",
      cubicFeet: 900,
      state: "in-storage",
      createdTick: 0,
      unloadedTick: 0,
      storageZoneId: initialStorageZone?.id ?? null,
      outboundOrderId: null,
      storedTick: 0,
      remainingStorageCubicFeet: null,
      pickedTick: null,
      loadedTick: null,
      dockTileIndex: null,
    });

    runner.dispatch(new PaintZoneCommand(10, 10, TileZoneType.Travel));

    const storageZone = state.warehouseMap.zones.find(
      (zone) => zone.zoneType === TileZoneType.StandardStorage,
    );

    expect(storageZone?.usedCubicFeet).toBe(900);
    expect(storageZone?.capacityCubicFeet).toBe(1100);
    expect(state.freightFlow.freightBatches[0].storageZoneId).toBe(storageZone?.id);
  });
});
