import {
  selectAverageDoorDwell,
  selectAverageYardDwell,
  selectDoorSummary,
  selectDockFreightCubicFeet,
  selectDockStorageNeeds,
  selectInboundQueueSummary,
  selectInboundTrailerCount,
  selectOutboundQueueSummary,
  selectOutboundShippedCubicFeet,
  selectStorageCapacitySummary,
  selectStorageQueueCubicFeet,
  selectTotalStoredCubicFeet,
} from "../../../game/simulation/selectors/queueSelectors";
import { useSimulationState } from "../../hooks/useSimulation";
import { useUiStore } from "../../store/uiStore";

export function RightOperationsPanel() {
  const hoveredTile = useUiStore((state) => state.hoveredTile);
  const selectedTile = useUiStore((state) => state.selectedTile);
  const inspectedTile = selectedTile ?? hoveredTile;
  const queues = useSimulationState(selectInboundQueueSummary);
  const doors = useSimulationState(selectDoorSummary);
  const dockFreightCubicFeet = useSimulationState(selectDockFreightCubicFeet);
  const dockStorageNeeds = useSimulationState(selectDockStorageNeeds);
  const inboundTrailerCount = useSimulationState(selectInboundTrailerCount);
  const averageYardDwell = useSimulationState(selectAverageYardDwell);
  const averageDoorDwell = useSimulationState(selectAverageDoorDwell);
  const storedCubicFeet = useSimulationState(selectTotalStoredCubicFeet);
  const storageCapacity = useSimulationState(selectStorageCapacitySummary);
  const storageQueueCubicFeet = useSimulationState(selectStorageQueueCubicFeet);
  const outboundQueues = useSimulationState(selectOutboundQueueSummary);
  const outboundShippedCubicFeet = useSimulationState(selectOutboundShippedCubicFeet);

  return (
    <aside className="right-panel" aria-label="Operations">
      <strong>Operations</strong>
      <section className="operations-summary">
        <p>Inbound flow is active when time is running.</p>
        <dl>
          <dt>Total inbound</dt>
          <dd>{inboundTrailerCount}</dd>
          <dt>Active doors</dt>
          <dd>{doors.activeDoors}</dd>
          <dt>Idle doors</dt>
          <dd>{doors.idleDoors}</dd>
          <dt>Reserved</dt>
          <dd>{doors.reservedDoors}</dd>
          <dt>Unloading</dt>
          <dd>{doors.unloadingDoors}</dd>
          <dt>Loading</dt>
          <dd>{doors.loadingDoors}</dd>
          <dt>Yard queue</dt>
          <dd>{queues.yardTrailers}</dd>
          <dt>Switching</dt>
          <dd>{queues.switchingTrailers}</dd>
          <dt>Unload queue</dt>
          <dd>{queues.unloadTrailers}</dd>
          <dt>Dock freight</dt>
          <dd>{dockFreightCubicFeet.toLocaleString()} cu ft</dd>
          <dt>Avg yard dwell</dt>
          <dd>{averageYardDwell.toFixed(1)} ticks</dd>
          <dt>Avg door dwell</dt>
          <dd>{averageDoorDwell.toFixed(1)} ticks</dd>
          <dt>Stored</dt>
          <dd>{storedCubicFeet.toLocaleString()} cu ft</dd>
          <dt>Storage cap</dt>
          <dd>
            {storageCapacity.usedCubicFeet.toLocaleString()} /{" "}
            {storageCapacity.capacityCubicFeet.toLocaleString()} cu ft
          </dd>
          <dt>Blocked dock</dt>
          <dd>{storageQueueCubicFeet.toLocaleString()} cu ft</dd>
          <dt>Open orders</dt>
          <dd>{outboundQueues.openOrders}</dd>
          <dt>Picked orders</dt>
          <dd>{outboundQueues.pickedOrders}</dd>
          <dt>Loading orders</dt>
          <dd>{outboundQueues.loadingOrders}</dd>
          <dt>Blocked orders</dt>
          <dd>{outboundQueues.blockedOrders}</dd>
          <dt>Pick queue</dt>
          <dd>{outboundQueues.pickQueueCubicFeet.toLocaleString()} cu ft</dd>
          <dt>Load queue</dt>
          <dd>{outboundQueues.loadQueueCubicFeet.toLocaleString()} cu ft</dd>
          <dt>Outbound shipped</dt>
          <dd>{outboundShippedCubicFeet.toLocaleString()} cu ft</dd>
        </dl>
      </section>
      <section className="dock-storage-needs">
        <strong>Dock storage needs</strong>
        {dockStorageNeeds.length > 0 ? (
          <ul>
            {dockStorageNeeds.map((need) => (
              <li key={need.freightClassId} className={need.ready ? "ready" : "blocked"}>
                <span>{need.freightClassName}</span>
                <small>
                  {need.cubicFeetOnDock.toLocaleString()} cu ft on dock; needs{" "}
                  {formatZoneNames(need.compatibleZoneNames)}
                </small>
                <small>
                  {need.reason}. {need.validCompatibleCapacityCubicFeet.toLocaleString()} cu ft
                  ready, largest opening{" "}
                  {need.largestCompatibleAvailableCubicFeet.toLocaleString()} cu ft.
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>Dock is clear.</p>
        )}
      </section>
      <p>{selectedTile ? "Selected tile" : "Hover tile"}</p>
      {inspectedTile ? (
        <dl>
          <dt>Position</dt>
          <dd>
            {inspectedTile.x}, {inspectedTile.y}
          </dd>
          <dt>Zone</dt>
          <dd>{inspectedTile.zoneType}</dd>
          <dt>Zone ID</dt>
          <dd>{inspectedTile.zoneId ?? "none"}</dd>
          <dt>Storage valid</dt>
          <dd>{inspectedTile.validForStorage ? "yes" : "no"}</dd>
          <dt>Invalid reason</dt>
          <dd>{inspectedTile.invalidReason ?? "none"}</dd>
          <dt>Nearest travel</dt>
          <dd>
            {inspectedTile.nearestTravelDistance === null
              ? "none"
              : `${inspectedTile.nearestTravelDistance} tiles`}
          </dd>
          <dt>Protected dock edge</dt>
          <dd>{inspectedTile.isDockEdge ? "yes" : "no"}</dd>
        </dl>
      ) : (
        <p>Click a warehouse tile.</p>
      )}
      <p>
        Hover:{" "}
        {hoveredTile
          ? `${hoveredTile.x}, ${hoveredTile.y} (${hoveredTile.zoneType})`
          : "none"}
      </p>
    </aside>
  );
}

function formatZoneNames(zoneNames: string[]): string {
  if (zoneNames.length === 0) {
    return "unknown storage";
  }

  if (zoneNames.length === 1) {
    return zoneNames[0];
  }

  return `${zoneNames.slice(0, -1).join(", ")} or ${zoneNames[zoneNames.length - 1]}`;
}
