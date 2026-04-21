import { Fragment, type ReactNode, useEffect, useState } from "react";
import { getDifficultyModeById } from "../../../game/simulation/config/difficulty";
import { selectContractPortfolioCards } from "../../../game/simulation/selectors/contractSelectors";
import { selectOperationalIssues } from "../../../game/simulation/selectors/diagnosticSelectors";
import {
  selectContractSummary,
  selectEconomySummary,
  selectScoreSummary,
} from "../../../game/simulation/selectors/kpiSelectors";
import { OpenMonthlyPlanningCommand } from "../../../game/simulation/commands/OpenMonthlyPlanningCommand";
import {
  selectBottleneckSummary,
  selectLaborRoleDetails,
  selectLaborSummary,
} from "../../../game/simulation/selectors/laborSelectors";
import {
  selectAverageDoorDwell,
  selectAverageYardDwell,
  selectDockCapacity,
  selectDockFreightCubicFeet,
  selectDockStorageNeeds,
  selectDoorSummary,
  selectInboundQueueSummary,
  selectInboundTrailerCount,
  selectOutboundQueueSummary,
  selectOutboundShippedCubicFeet,
  selectStorageCapacitySummary,
  selectStorageQueueCubicFeet,
  selectTotalStoredCubicFeet,
} from "../../../game/simulation/selectors/queueSelectors";
import { useSimulation, useSimulationState } from "../../hooks/useSimulation";
import { usePlaytestReview } from "../../hooks/usePlaytestReview";
import { useUiStore } from "../../store/uiStore";

export function RightOperationsPanel() {
  const simulation = useSimulation();
  const hoveredTile = useUiStore((state) => state.hoveredTile);
  const selectedTile = useUiStore((state) => state.selectedTile);
  const setLaborDialogOpen = useUiStore((state) => state.setLaborDialogOpen);
  const requestMapFocus = useUiStore((state) => state.requestMapFocus);
  const inspectedTile = selectedTile ?? hoveredTile;
  const operationalIssues = useSimulationState(selectOperationalIssues);
  const queues = useSimulationState(selectInboundQueueSummary);
  const doors = useSimulationState(selectDoorSummary);
  const dockFreightCubicFeet = useSimulationState(selectDockFreightCubicFeet);
  const dockCapacity = useSimulationState(selectDockCapacity);
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
  const planning = useSimulationState((state) => state.planning);
  const contractPortfolioCards = useSimulationState(selectContractPortfolioCards);
  const difficultyMode = useSimulationState((state) =>
    getDifficultyModeById(state.difficultyModeId),
  );
  const playtestReview = usePlaytestReview();
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [activeIssueIndex, setActiveIssueIndex] = useState(0);
  const [activeContractPage, setActiveContractPage] = useState(0);
  const contractPageCount = Math.max(1, Math.ceil(contractPortfolioCards.length / 3));
  const visibleContractCards = contractPortfolioCards.slice(
    activeContractPage * 3,
    activeContractPage * 3 + 3,
  );
  const activeIssue =
    operationalIssues.length > 0
      ? operationalIssues[Math.min(activeIssueIndex, operationalIssues.length - 1)]
      : null;
  const activeIssueFocusTarget = activeIssue?.focusTarget;

  useEffect(() => {
    setActiveIssueIndex((current) =>
      operationalIssues.length === 0 ? 0 : Math.min(current, operationalIssues.length - 1),
    );
  }, [operationalIssues.length]);
  useEffect(() => {
    setActiveContractPage((current) => Math.min(current, Math.max(0, contractPageCount - 1)));
  }, [contractPageCount]);

  const copyPlaytestReview = async () => {
    try {
      await navigator.clipboard.writeText(playtestReview.exportText);
      setCopyMessage("Review copied.");
    } catch {
      setCopyMessage("Copy failed in this browser.");
    }
  };

  return (
    <aside className="right-panel" aria-label="Operations">
      <strong>Operations</strong>
      {activeIssue ? (
        <section className={`issue-summary ${activeIssue.severity}`}>
          <div className="issue-summary-header">
            <div>
              <span>{activeIssue.severity}</span>
              <strong>{activeIssue.title}</strong>
            </div>
            {operationalIssues.length > 1 ? (
              <div className="issue-carousel-controls" aria-label="Issue carousel">
                <button
                  aria-label="Previous issue"
                  onClick={() =>
                    setActiveIssueIndex((current) =>
                      current === 0 ? operationalIssues.length - 1 : current - 1,
                    )
                  }
                  type="button"
                >
                  {"<"}
                </button>
                <small>
                  {activeIssueIndex + 1} / {operationalIssues.length}
                </small>
                <button
                  aria-label="Next issue"
                  onClick={() =>
                    setActiveIssueIndex((current) => (current + 1) % operationalIssues.length)
                  }
                  type="button"
                >
                  {">"}
                </button>
              </div>
            ) : null}
          </div>
          <small>{activeIssue.detail}</small>
          <small>{activeIssue.recommendedAction}</small>
          {activeIssueFocusTarget ? (
            <button
              onClick={() =>
                requestMapFocus({
                  reason: activeIssueFocusTarget.label,
                  x: activeIssueFocusTarget.x,
                  y: activeIssueFocusTarget.y,
                  zoom: 0.94,
                })
              }
              type="button"
            >
              Focus
            </button>
          ) : null}
          {operationalIssues.length > 1 ? (
            <small>
              {operationalIssues.length - 1} more issue
              {operationalIssues.length === 2 ? "" : "s"} available.
            </small>
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
          <dt>Dock cap</dt>
          <dd>
            {dockCapacity.usedCubicFeet.toLocaleString()} /{" "}
            {dockCapacity.totalCapacityCubicFeet.toLocaleString()} cu ft
          </dd>
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
        <div className="panel-section-heading">
          <button
            onClick={() => simulation.dispatch(new OpenMonthlyPlanningCommand())}
            type="button"
          >
            Plan
          </button>
          <small>
            {planning.isPlanningActive
              ? "Planning open"
              : planning.queuedPlan
                ? "Queued for next tick"
                : "Ready"}
          </small>
        </div>
        <dl>
          <dt>Difficulty</dt>
          <dd>{difficultyMode.name}</dd>
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
          <dt>Contracts</dt>
          <dd>{contracts.activeContracts.length}</dd>
          <dt>Portfolio</dt>
          <dd>{describePortfolioHealth(contractPortfolioCards)}</dd>
        </dl>
      </CollapsibleSection>
      <CollapsibleSection title="Contracts">
        <div className="panel-section-heading">
          <span>
            {contractPortfolioCards.length} active contract
            {contractPortfolioCards.length === 1 ? "" : "s"}
          </span>
          {contractPortfolioCards.length > 3 ? (
            <div className="issue-carousel-controls" aria-label="Contract pages">
              <button
                aria-label="Previous contract page"
                onClick={() =>
                  setActiveContractPage((current) =>
                    current === 0 ? contractPageCount - 1 : current - 1,
                  )
                }
                type="button"
              >
                {"<"}
              </button>
              <small>
                {activeContractPage + 1} / {contractPageCount}
              </small>
              <button
                aria-label="Next contract page"
                onClick={() =>
                  setActiveContractPage((current) => (current + 1) % contractPageCount)
                }
                type="button"
              >
                {">"}
              </button>
            </div>
          ) : null}
        </div>
        {visibleContractCards.length > 0 ? (
          <div className="contract-portfolio-list">
            {visibleContractCards.map((contract) => (
              <article className={`contract-portfolio-card ${contract.health}`} key={contract.id}>
                <header>
                  <div>
                    <strong>{contract.clientName}</strong>
                    <small>{contract.freightClassName}</small>
                  </div>
                  <span>{contract.health}</span>
                </header>
                <dl>
                  <dt>KPI</dt>
                  <dd>{contract.performanceScore.toFixed(0)}</dd>
                  <dt>Service</dt>
                  <dd>
                    {contract.serviceLevel.toFixed(0)}% / {contract.minimumServiceLevel}%
                  </dd>
                  <dt>Inventory</dt>
                  <dd>{contract.inventoryCubicFeet.toLocaleString()} cu ft</dd>
                  <dt>7-day</dt>
                  <dd>{contract.weeklyThroughputCubicFeet.toLocaleString()} cu ft</dd>
                  <dt>30-day</dt>
                  <dd>{contract.monthlyThroughputCubicFeet.toLocaleString()} cu ft</dd>
                  <dt>Labor/day</dt>
                  <dd>${formatMoney(contract.estimatedDailyLaborCost)}</dd>
                  <dt>Headcount/day</dt>
                  <dd>{contract.estimatedDailyHeadcount.toFixed(2)}</dd>
                  <dt>Rate</dt>
                  <dd>${contract.revenuePerCubicFoot.toFixed(2)} / cu ft</dd>
                  <dt>Penalties</dt>
                  <dd>${formatMoney(contract.penaltyCostToDate)}</dd>
                </dl>
                <small>{contract.operationalChallengeNote}</small>
              </article>
            ))}
          </div>
        ) : (
          <p>No active contracts beyond the baseline network.</p>
        )}
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
          Top bottleneck: {topBottleneck ? `${topBottleneck.label} ${topBottleneck.pressure}` : "none"}
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
      <CollapsibleSection title="Playtest Review">
        <p>
          {playtestReview.records.length} completed month
          {playtestReview.records.length === 1 ? "" : "s"} recorded on {difficultyMode.name}.
        </p>
        {playtestReview.records.length > 0 ? (
          <ul className="playtest-review-list">
            {playtestReview.records.slice(-3).reverse().map((record) => (
              <li key={record.monthKey}>
                <strong>{record.monthKey}</strong>
                <small>
                  Net ${formatMoney(record.monthlyNet)}; service {record.serviceLevel.toFixed(0)}%;
                  queue avg {record.avgQueuePressure.toFixed(2)}.
                </small>
                <small>
                  Dock avg {Math.round(record.avgDockFreightCubicFeet).toLocaleString()} cu ft;
                  blocked peak {record.peakBlockedOutboundOrders}.
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>Reach the next planning screen to capture the first monthly review.</p>
        )}
        <div className="panel-section-heading">
          <button onClick={copyPlaytestReview} type="button">
            Copy Review
          </button>
          {copyMessage ? <small>{copyMessage}</small> : null}
        </div>
        <textarea
          aria-label="Playtest export"
          className="playtest-review-export"
          readOnly
          value={playtestReview.exportText}
        />
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
          {hoveredTile ? `${hoveredTile.x}, ${hoveredTile.y} (${hoveredTile.zoneType})` : "none"}
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

function describePortfolioHealth(
  contracts: ReturnType<typeof selectContractPortfolioCards>,
): string {
  if (contracts.length === 0) {
    return "none";
  }

  if (contracts.some((contract) => contract.health === "critical")) {
    return "critical";
  }

  if (contracts.some((contract) => contract.health === "at-risk")) {
    return "at-risk";
  }

  if (contracts.some((contract) => contract.health === "stable")) {
    return "stable";
  }

  return "healthy";
}
