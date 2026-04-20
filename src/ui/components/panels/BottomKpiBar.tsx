import { selectKpis } from "../../../game/simulation/selectors/kpiSelectors";
import { selectLaborSummary } from "../../../game/simulation/selectors/laborSelectors";
import {
  selectInboundQueueSummary,
  selectOpenOutboundOrderCount,
  selectOutboundShippedCubicFeet,
  selectTotalStoredCubicFeet,
} from "../../../game/simulation/selectors/queueSelectors";
import { useSimulationState } from "../../hooks/useSimulation";

export function BottomKpiBar() {
  const kpis = useSimulationState(selectKpis);
  const queues = useSimulationState(selectInboundQueueSummary);
  const storedCubicFeet = useSimulationState(selectTotalStoredCubicFeet);
  const openOutboundOrders = useSimulationState(selectOpenOutboundOrderCount);
  const outboundShippedCubicFeet = useSimulationState(selectOutboundShippedCubicFeet);
  const laborSummary = useSimulationState(selectLaborSummary);

  return (
    <footer className="bottom-kpi-bar">
      <span>Inbound: {kpis.inboundCubicFeet.toLocaleString()} cu ft</span>
      <span>Outbound: {kpis.outboundCubicFeet.toLocaleString()} cu ft</span>
      <span>Throughput: {kpis.throughputCubicFeet.toLocaleString()} cu ft</span>
      <span>Stored: {storedCubicFeet.toLocaleString()} cu ft</span>
      <span>Open Orders: {openOutboundOrders}</span>
      <span>Shipped: {outboundShippedCubicFeet.toLocaleString()} cu ft</span>
      <span>
        Labor: {laborSummary.totalHeadcount - laborSummary.unassignedHeadcount}/
        {laborSummary.totalHeadcount}
      </span>
      <span>
        Bottleneck: {laborSummary.topBottleneck ? laborSummary.topBottleneck.label : "none"}
      </span>
      <span>Yard: {queues.yardTrailers}</span>
      <span>Switching: {queues.switchingTrailers}</span>
      <span>Unload: {queues.unloadTrailers}</span>
      <span>Dock: {queues.dockFreightCubicFeet.toLocaleString()} cu ft</span>
    </footer>
  );
}
