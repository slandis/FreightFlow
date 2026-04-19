import { selectKpis } from "../../../game/simulation/selectors/kpiSelectors";
import { selectInboundQueueSummary } from "../../../game/simulation/selectors/queueSelectors";
import { useSimulationState } from "../../hooks/useSimulation";

export function BottomKpiBar() {
  const kpis = useSimulationState(selectKpis);
  const queues = useSimulationState(selectInboundQueueSummary);

  return (
    <footer className="bottom-kpi-bar">
      <span>Inbound: {kpis.inboundCubicFeet.toLocaleString()} cu ft</span>
      <span>Outbound: {kpis.outboundCubicFeet.toLocaleString()} cu ft</span>
      <span>Throughput: {kpis.throughputCubicFeet.toLocaleString()} cu ft</span>
      <span>Yard: {queues.yardTrailers}</span>
      <span>Switching: {queues.switchingTrailers}</span>
      <span>Unload: {queues.unloadTrailers}</span>
      <span>Dock: {queues.dockFreightCubicFeet.toLocaleString()} cu ft</span>
    </footer>
  );
}
