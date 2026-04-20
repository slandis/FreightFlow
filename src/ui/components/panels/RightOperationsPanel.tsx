import { Fragment, type ReactNode, useState } from "react";
import { selectMostSevereIssue } from "../../../game/simulation/selectors/diagnosticSelectors";
import {
  selectEconomySummary,
  selectScoreSummary,
  selectContractSummary,
} from "../../../game/simulation/selectors/kpiSelectors";
import {
  selectBottleneckSummary,
  selectLaborRoleDetails,
  selectLaborSummary,
} from "../../../game/simulation/selectors/laborSelectors";
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
  const setLaborDialogOpen = useUiStore((state) => state.setLaborDialogOpen);
  const requestMapFocus = useUiStore((state) => state.requestMapFocus);
  const inspectedTile = selectedTile ?? hoveredTile;
  const mostSevereIssue = useSimulationState(selectMostSevereIssue);
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
  const laborSummary = useSimulationState(selectLaborSummary);
  const laborRoles = useSimulationState(selectLaborRoleDetails);
  const topBottleneck = useSimulationState(selectBottleneckSummary);
  const economy = useSimulationState(selectEconomySummary);
  const scores = useSimulationState(selectScoreSummary);
  const contracts = useSimulationState(selectContractSummary);

  return (
    <aside className="right-panel" aria-label="Operations">
      <strong>Operations</strong>
      {mostSevereIssue ? (
        <section className={`issue-summary ${mostSevereIssue.severity}`}>
          <span>{mostSevereIssue.severity}</span>
          <strong>{mostSevereIssue.title}</strong>
          <small>{mostSevereIssue.recommendedAction}</small>
          {mostSevereIssue.focusTarget ? (
            <button
              onClick={() =>
                requestMapFocus({
                  reason: mostSevereIssue.focusTarget?.label ?? mostSevereIssue.title,
                  x: mostSevereIssue.focusTarget?.x ?? 0,
                  y: mostSevereIssue.focusTarget?.y ?? 0,
                  zoom: 0.94,
                })
              }
              type="button"
            >
              Focus
            </button>
          ) : null}
        </section>
      ) : (
        <section className="issue-summary stable">
          <span>stable</span>
          <strong>No urgent issues</strong>
          <small>Keep an eye on flow, storage, labor, and service.</small>
        </section>
      )}
      <CollapsibleSection defaultOpen title="Flow">
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
      </CollapsibleSection>
      <CollapsibleSection title="Business">
        <dl>
          <dt>Revenue</dt>
          <dd>${formatMoney(economy.currentMonthRevenue)}</dd>
          <dt>Labor cost</dt>
          <dd>${formatMoney(economy.currentMonthLaborCost)}</dd>
          <dt>Operating cost</dt>
          <dd>${formatMoney(economy.currentMonthOperatingCost)}</dd>
          <dt>Net</dt>
          <dd>${formatMoney(economy.currentMonthNet)}</dd>
          <dt>Service level</dt>
          <dd>{contracts.serviceLevel.toFixed(0)}%</dd>
          <dt>Contract</dt>
          <dd>{contracts.activeContracts[0]?.health ?? "none"}</dd>
        </dl>
      </CollapsibleSection>
      <CollapsibleSection title="Scores">
        <dl>
          <dt>Morale</dt>
          <dd>{formatScore(scores.morale.value, scores.morale.trend)}</dd>
          <dt>Condition</dt>
          <dd>{formatScore(scores.condition.value, scores.condition.trend)}</dd>
          <dt>Safety</dt>
          <dd>{formatScore(scores.safety.value, scores.safety.trend)}</dd>
          <dt>Client</dt>
          <dd>{formatScore(scores.clientSatisfaction.value, scores.clientSatisfaction.trend)}</dd>
          <dt>Customer</dt>
          <dd>{formatScore(scores.customerSatisfaction.value, scores.customerSatisfaction.trend)}</dd>
        </dl>
        <p>{formatTopScoreDriver(scores)}</p>
      </CollapsibleSection>
      <CollapsibleSection title="Labor">
        <div className="panel-section-heading">
          <button type="button" onClick={() => setLaborDialogOpen(true)}>
            Assign
          </button>
        </div>
        <p>
          {laborSummary.totalHeadcount} total; {laborSummary.unassignedHeadcount} unassigned.
        </p>
        <p>
          Top bottleneck:{" "}
          {topBottleneck
            ? `${topBottleneck.label} ${topBottleneck.pressure}`
            : "none"}
        </p>
        <dl>
          {laborRoles.map((pool) => (
            <Fragment key={pool.roleId}>
              <dt>{formatLaborRole(pool.roleId)}</dt>
              <dd>
                {pool.assignedHeadcount} / {pool.pressure}
              </dd>
            </Fragment>
          ))}
        </dl>
      </CollapsibleSection>
      <CollapsibleSection title="Dock Storage Needs">
        {dockStorageNeeds.length > 0 ? (
          <ul className="dock-storage-needs">
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
                {!need.ready ? (
                  <button
                    onClick={() =>
                      requestMapFocus({
                        reason: `${need.freightClassName} dock need`,
                        x: 32,
                        y: 0,
                        zoom: 0.94,
                      })
                    }
                    type="button"
                  >
                    Focus dock
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>Dock is clear.</p>
        )}
      </CollapsibleSection>
      <CollapsibleSection defaultOpen title={selectedTile ? "Selected Tile" : "Hover Tile"}>
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
            <dt>Door</dt>
            <dd>{inspectedTile.isActiveDoor ? inspectedTile.doorId ?? "active" : "none"}</dd>
            <dt>Door mode</dt>
            <dd>{inspectedTile.doorMode ?? "none"}</dd>
            <dt>Door state</dt>
            <dd>{inspectedTile.doorState ?? "none"}</dd>
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
      </CollapsibleSection>
    </aside>
  );
}

function CollapsibleSection({
  children,
  defaultOpen = false,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`panel-collapsible ${isOpen ? "open" : ""}`}>
      <button
        aria-expanded={isOpen}
        className="panel-collapsible-toggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{title}</span>
        <span className="panel-collapsible-state">{isOpen ? "Hide" : "Show"}</span>
      </button>
      {isOpen ? <div className="panel-collapsible-body">{children}</div> : null}
    </section>
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

function formatLaborRole(roleId: string): string {
  return roleId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatScore(value: number, trend: string): string {
  return `${value.toFixed(0)} ${trend}`;
}

function formatTopScoreDriver(scores: ReturnType<typeof selectScoreSummary>): string {
  const drivers = [
    ...scores.morale.drivers,
    ...scores.condition.drivers,
    ...scores.safety.drivers,
    ...scores.clientSatisfaction.drivers,
    ...scores.customerSatisfaction.drivers,
  ].sort((first, second) => Math.abs(second.impact) - Math.abs(first.impact));

  if (!drivers[0]) {
    return "Scores are stable.";
  }

  return `Top driver: ${drivers[0].label} (${drivers[0].impact.toFixed(2)})`;
}
