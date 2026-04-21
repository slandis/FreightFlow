import type { Alert, AlertSeverity, GameState } from "../core/GameState";
import { countAvailableInboundDoorAssignments } from "../dock/dockCapacity";
import type { DomainEvent } from "../events/DomainEvent";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

interface AlertCandidate {
  key: string;
  severity: AlertSeverity;
  message: string;
}

export class AlertSystem {
  update(state: GameState, createEvent: EventFactory): DomainEvent[] {
    const events: DomainEvent[] = [];
    const candidates = this.buildCandidates(state);
    const activeKeys = new Set(candidates.map((candidate) => candidate.key));

    for (const candidate of candidates) {
      const existingAlert = state.alerts.alerts.find((alert) => alert.key === candidate.key);

      if (existingAlert) {
        existingAlert.severity = candidate.severity;
        existingAlert.message = candidate.message;

        if (!existingAlert.active) {
          existingAlert.active = true;
          existingAlert.raisedTick = state.currentTick;
          existingAlert.resolvedTick = null;
          events.push(createAlertRaisedEvent(createEvent, existingAlert));
        }

        continue;
      }

      const alert: Alert = {
        id: `alert-${state.alerts.nextAlertSequence.toString().padStart(3, "0")}`,
        key: candidate.key,
        severity: candidate.severity,
        message: candidate.message,
        active: true,
        raisedTick: state.currentTick,
        resolvedTick: null,
      };

      state.alerts.nextAlertSequence += 1;
      state.alerts.alerts.push(alert);
      events.push(createAlertRaisedEvent(createEvent, alert));
    }

    for (const alert of state.alerts.alerts) {
      if (alert.active && !activeKeys.has(alert.key)) {
        alert.active = false;
        alert.resolvedTick = state.currentTick;
        const event = {
          ...createEvent("alert-resolved"),
          alertId: alert.id,
          key: alert.key,
        };

        events.push(event);
      }
    }

    return events;
  }

  private buildCandidates(state: GameState): AlertCandidate[] {
    const candidates: AlertCandidate[] = [];

    if (state.cash < 25000) {
      candidates.push({
        key: "cash-low",
        severity: state.cash < 10000 ? "critical" : "warning",
        message: "Cash is running low.",
      });
    }

    addScoreCandidate(candidates, "morale", "Morale is critical.", state.scores.morale.value);
    addScoreCandidate(candidates, "safety", "Safety is declining.", state.scores.safety.value);
    addScoreCandidate(
      candidates,
      "condition",
      "Warehouse condition is critical.",
      state.scores.condition.value,
    );
    addScoreCandidate(
      candidates,
      "customer-satisfaction",
      "Customer satisfaction is falling.",
      state.scores.customerSatisfaction.value,
    );
    addScoreCandidate(
      candidates,
      "client-satisfaction",
      "Client satisfaction is falling.",
      state.scores.clientSatisfaction.value,
    );

    const mostAtRiskContract = [...state.contracts.activeContracts]
      .sort((first, second) => first.serviceLevel - second.serviceLevel)[0];

    if (
      mostAtRiskContract &&
      mostAtRiskContract.serviceLevel < mostAtRiskContract.minimumServiceLevel
    ) {
      candidates.push({
        key: "contract-service-level",
        severity:
          mostAtRiskContract.serviceLevel < mostAtRiskContract.minimumServiceLevel * 0.65
          ? "critical"
          : "warning",
        message: `${mostAtRiskContract.clientName} service level is below target.`,
      });
    }

    if (
      state.freightFlow.queues.yardTrailers > 0 &&
      countAvailableInboundDoorAssignments(state) === 0
    ) {
      candidates.push({
        key: "dock-capacity-blocked",
        severity: "critical",
        message: "Inbound trailers are blocked from the dock.",
      });
    }

    return candidates;
  }
}

function addScoreCandidate(
  candidates: AlertCandidate[],
  key: string,
  message: string,
  value: number,
): void {
  if (value >= 50) {
    return;
  }

  candidates.push({
    key,
    severity: value < 35 ? "critical" : "warning",
    message,
  });
}

function createAlertRaisedEvent(createEvent: EventFactory, alert: Alert) {
  return {
    ...createEvent("alert-raised"),
    alertId: alert.id,
    key: alert.key,
    severity: alert.severity,
    message: alert.message,
  };
}
