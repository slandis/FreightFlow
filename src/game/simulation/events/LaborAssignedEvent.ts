import type { LaborRole } from "../types/enums";
import type { DomainEvent } from "./DomainEvent";

export interface LaborAssignedEvent extends DomainEvent {
  type: "labor-assigned";
  roleId: LaborRole;
  assignedHeadcount: number;
  unassignedHeadcount: number;
}
