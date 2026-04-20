import type { LaborRole } from "../types/enums";

export type LaborPressure = "healthy" | "stable" | "busy" | "strained" | "critical";

export interface LaborPool {
  roleId: LaborRole;
  assignedHeadcount: number;
  availableHeadcount: number;
  baseRate: number;
  effectiveRate: number;
  activeWorkload: number;
  utilization: number;
  pressure: LaborPressure;
}

export interface LaborModifiers {
  productivityMultiplier: number;
  coordinationMultiplier: number;
  congestionPenalty: number;
  conditionPressure: number;
  sanitationPressure: LaborPressure;
  managementPressure: LaborPressure;
}

export interface LaborBottleneck {
  roleId: LaborRole;
  label: string;
  pressure: LaborPressure;
  queuedWork: number;
  assignedHeadcount: number;
  effectiveRate: number;
  reason: string;
  recommendation: string;
}

export interface LaborPressureSummary {
  bottlenecks: LaborBottleneck[];
  criticalCount: number;
  topBottleneck: LaborBottleneck | null;
}

export interface LaborState {
  totalHeadcount: number;
  unassignedHeadcount: number;
  pools: LaborPool[];
  modifiers: LaborModifiers;
  pressure: LaborPressureSummary;
}
