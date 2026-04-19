import {
  selectAverageDoorDwell,
  selectAverageYardDwell,
  selectDoorSummary,
  selectDockFreightCubicFeet,
  selectInboundQueueSummary,
  selectInboundTrailerCount,
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
  const inboundTrailerCount = useSimulationState(selectInboundTrailerCount);
  const averageYardDwell = useSimulationState(selectAverageYardDwell);
  const averageDoorDwell = useSimulationState(selectAverageDoorDwell);

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
        </dl>
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
