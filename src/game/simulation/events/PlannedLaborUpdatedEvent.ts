import { LaborRole } from "../types/enums";
import type { DomainEvent } from "./DomainEvent";

export interface PlannedLaborUpdatedEvent extends DomainEvent {
  type: "planned-labor-updated";
  monthKey: string;
  roleId: LaborRole;
  assignedHeadcount: number;
  unassignedHeadcount: number;
}
