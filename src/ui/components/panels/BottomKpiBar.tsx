import { selectQueuePressureSummary } from "../../../game/simulation/selectors/diagnosticSelectors";
import { selectKpis } from "../../../game/simulation/selectors/kpiSelectors";
import { selectLaborSummary } from "../../../game/simulation/selectors/laborSelectors";
import {
  selectInboundQueueSummary,
  selectOpenOutboundOrderCount,
  selectOutboundShippedCubicFeet,
  selectTotalStoredCubicFeet,
} from "../../../game/simulation/selectors/queueSelectors";
import { useSimulationState } from "../../hooks/useSimulation";
import { useUiStore } from "../../store/uiStore";
import { MetricTooltip } from "../tooltips/MetricTooltip";

export function BottomKpiBar() {
  const kpis = useSimulationState(selectKpis);
  const queues = useSimulationState(selectInboundQueueSummary);
  const queuePressure = useSimulationState(selectQueuePressureSummary);
  const storedCubicFeet = useSimulationState(selectTotalStoredCubicFeet);
  const openOutboundOrders = useSimulationState(selectOpenOutboundOrderCount);
  const outboundShippedCubicFeet = useSimulationState(selectOutboundShippedCubicFeet);
  const laborSummary = useSimulationState(selectLaborSummary);
  const setActiveOverlayMode = useUiStore((state) => state.setActiveOverlayMode);

  return (
    <footer className="bottom-kpi-bar">
      <KpiPill
        label="Dock"
        onClick={() => setActiveOverlayMode("door-utilization")}
        tooltip="Freight currently on dock awaiting storage movement."
        value={`${queues.dockFreightCubicFeet.toLocaleString()} cu ft`}
      />
      <KpiPill
        label="Inbound"
        onClick={() => setActiveOverlayMode("queue-pressure")}
        tooltip="Total inbound cubic feet processed this month."
        value={`${kpis.inboundCubicFeet.toLocaleString()} cu ft`}
      />
      <KpiPill
        label="Outbound"
        onClick={() => setActiveOverlayMode("queue-pressure")}
        tooltip="Total outbound cubic feet shipped this month."
        value={`${kpis.outboundCubicFeet.toLocaleString()} cu ft`}
      />
      <KpiPill
        label="Throughput"
        tooltip="Average of inbound and outbound volume for operating performance."
        value={`${kpis.throughputCubicFeet.toLocaleString()} cu ft`}
      />
      <KpiPill
        label="Stored"
        onClick={() => setActiveOverlayMode("storage-capacity")}
        tooltip="Current cubic feet held in warehouse storage."
        value={`${storedCubicFeet.toLocaleString()} cu ft`}
      />
      <KpiPill
        label="Open Orders"
        onClick={() => setActiveOverlayMode("queue-pressure")}
        tooltip="Outbound orders waiting to be picked, loaded, or completed."
        value={openOutboundOrders.toLocaleString()}
      />
      <KpiPill
        label="Shipped"
        tooltip="Outbound freight shipped so far this month."
        value={`${outboundShippedCubicFeet.toLocaleString()} cu ft`}
      />
      <KpiPill
        label="Revenue"
        tooltip="Revenue earned from outbound movement and active contract flow."
        value={`$${kpis.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
      />
      <KpiPill
        label="Labor Cost"
        tooltip="Current month labor spending."
        value={`$${kpis.laborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
      />
      <KpiPill
        label="Net"
        tooltip="Revenue minus labor and operating costs this month."
        value={`$${kpis.netOperatingResult.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
      />
      <KpiPill
        label="Client"
        tooltip="Contract and throughput satisfaction from business clients."
        value={kpis.clientSatisfactionScore.toFixed(0)}
      />
      <KpiPill
        label="Customer"
        tooltip="Outbound service quality and order fulfillment satisfaction."
        value={kpis.customerSatisfactionScore.toFixed(0)}
      />
      <KpiPill
        label="Labor"
        tooltip="Assigned labor compared with total headcount."
        value={`${laborSummary.totalHeadcount - laborSummary.unassignedHeadcount}/${laborSummary.totalHeadcount}`}
      />
      <KpiPill
        label="Yard"
        onClick={() => setActiveOverlayMode("queue-pressure")}
        tooltip={`Queue pressure is ${queuePressure.severity}.`}
        value={queues.yardTrailers.toLocaleString()}
      />
    </footer>
  );
}

function KpiPill({
  label,
  onClick,
  tooltip,
  value,
}: {
  label: string;
  onClick?: () => void;
  tooltip: string;
  value: string;
}) {
  const content = (
    <button className="kpi-pill" disabled={!onClick} onClick={onClick} type="button">
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );

  return (
    <MetricTooltip content={tooltip} label={label}>
      {content}
    </MetricTooltip>
  );
}
