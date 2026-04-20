import { selectOperationalIssues } from "../../../game/simulation/selectors/diagnosticSelectors";
import { useSimulationState } from "../../hooks/useSimulation";
import { useUiStore } from "../../store/uiStore";

export function AlertsCenter() {
  const issues = useSimulationState(selectOperationalIssues);
  const requestMapFocus = useUiStore((state) => state.requestMapFocus);
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const visibleIssues = issues.slice(0, 4);

  return (
    <section className="alerts-center" aria-label="Alerts">
      <header>
        <strong>Issues: {issues.length}</strong>
        <span>
          {criticalCount} critical / {warningCount} warning
        </span>
      </header>
      {visibleIssues.length > 0 ? (
        <ul className="issue-list">
          {visibleIssues.map((issue) => (
            <li key={issue.id} className={issue.severity}>
              <div>
                <strong>{issue.title}</strong>
                <small>{issue.detail}</small>
                <small>{issue.recommendedAction}</small>
              </div>
              {issue.focusTarget ? (
                <button
                  onClick={() =>
                    requestMapFocus({
                      reason: issue.focusTarget?.label ?? issue.title,
                      x: issue.focusTarget?.x ?? 0,
                      y: issue.focusTarget?.y ?? 0,
                      zoom: 0.94,
                    })
                  }
                  type="button"
                >
                  Focus
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {issues.length > visibleIssues.length ? (
        <small>{issues.length - visibleIssues.length} more in Operations.</small>
      ) : null}
    </section>
  );
}
