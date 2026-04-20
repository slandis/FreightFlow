import { selectActiveAlerts } from "../../../game/simulation/selectors/kpiSelectors";
import { useSimulationState } from "../../hooks/useSimulation";

export function AlertsCenter() {
  const alerts = useSimulationState(selectActiveAlerts);

  return (
    <section className="alerts-center" aria-label="Alerts">
      <strong>Alerts: {alerts.length}</strong>
      {alerts.length > 0 ? (
        <ul>
          {alerts.slice(0, 3).map((alert) => (
            <li key={alert.id} className={alert.severity}>
              {alert.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
