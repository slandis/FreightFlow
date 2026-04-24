import { useEffect, useMemo, useState } from "react";
import { useSimulationRunner } from "../../../app/providers/SimulationProvider";
import { LocalSaveRepository } from "../../../persistence/LocalSaveRepository";
import { SAVE_SLOT_IDS, type SaveSlotSummary } from "../../../persistence/SaveGameSchema";
import { SaveLoadService } from "../../../persistence/SaveLoadService";
import {
  ensureTestScenarioSlots,
  resetTestScenarioSlot,
  TEST_SCENARIOS,
} from "../../../persistence/testScenarios";
import { useUiStore } from "../../store/uiStore";

export function SaveLoadDialog() {
  const simulation = useSimulationRunner();
  const setSaveLoadDialogOpen = useUiStore((state) => state.setSaveLoadDialogOpen);
  const saveLoadMessage = useUiStore((state) => state.saveLoadMessage);
  const setSaveLoadMessage = useUiStore((state) => state.setSaveLoadMessage);
  const saveLoadService = useMemo(
    () =>
      new SaveLoadService(
        new LocalSaveRepository(),
        () => simulation.getState(),
        (state) => simulation.replaceState(state),
      ),
    [simulation],
  );
  const [slots, setSlots] = useState(() => saveLoadService.listSlots());

  useEffect(() => {
    const repository = new LocalSaveRepository();
    ensureTestScenarioSlots(repository);
    setSlots(saveLoadService.listSlots());
  }, [saveLoadService]);

  function refreshSlots(): void {
    setSlots(saveLoadService.listSlots());
  }

  function applyResult(result: ReturnType<SaveLoadService["save"]>): void {
    setSaveLoadMessage(result.success ? result.message : result.errors.join("; "));
    refreshSlots();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="save-load-dialog" aria-label="Save and Load">
        <header>
          <div>
            <h2>Save / Load</h2>
            <p>Local browser slots for this playtest build.</p>
          </div>
          <button onClick={() => setSaveLoadDialogOpen(false)} type="button">
            Close
          </button>
        </header>
        {saveLoadMessage ? <p className="save-load-message">{saveLoadMessage}</p> : null}
        <div className="save-slot-list">
          {SAVE_SLOT_IDS.map((slotId) => {
            const slot = slots.find((candidate) => candidate.slotId === slotId) ?? {
              slotId,
              isEmpty: true,
              savedAt: null,
              metadata: null,
              error: null,
            };

            return (
              <SaveSlot
                key={slotId}
                onDelete={() => applyResult(saveLoadService.delete(slotId))}
                onLoad={() => applyResult(saveLoadService.load(slotId))}
                onSave={() => applyResult(saveLoadService.save(slotId))}
                slot={slot}
              />
            );
          })}
        </div>
        <div className="save-slot-list">
          {TEST_SCENARIOS.map((scenario) => {
            const slot = slots.find((candidate) => candidate.slotId === scenario.slotId) ?? {
              slotId: scenario.slotId,
              isEmpty: true,
              savedAt: null,
              metadata: null,
              error: null,
            };

            return (
              <ScenarioSlot
                key={scenario.slotId}
                description={scenario.description}
                label={scenario.label}
                onLoad={() => applyResult(saveLoadService.load(scenario.slotId))}
                onReset={() => {
                  resetTestScenarioSlot(new LocalSaveRepository(), scenario.slotId);
                  setSaveLoadMessage(`Reset ${scenario.label}`);
                  refreshSlots();
                }}
                slot={slot}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SaveSlot({
  onDelete,
  onLoad,
  onSave,
  slot,
}: {
  onDelete: () => void;
  onLoad: () => void;
  onSave: () => void;
  slot: SaveSlotSummary;
}) {
  return (
    <section className="save-slot">
      <div>
        <strong>{formatSlotName(slot.slotId)}</strong>
        {slot.isEmpty ? (
          <small>Empty slot</small>
        ) : (
          <>
            <small>Saved: {formatSavedAt(slot.savedAt)}</small>
            <small>
              {slot.metadata
                ? `${slot.metadata.calendarLabel}; ${slot.metadata.difficultyLabel ?? "Unknown"}; cash $${slot.metadata.cash.toLocaleString()}; alerts ${slot.metadata.activeAlertCount}`
                : "Metadata unavailable"}
            </small>
          </>
        )}
        {slot.error ? <small className="save-slot-error">{slot.error}</small> : null}
      </div>
      <div className="save-slot-actions">
        <button onClick={onSave} type="button">
          Save
        </button>
        <button disabled={slot.isEmpty} onClick={onLoad} type="button">
          Load
        </button>
        <button disabled={slot.isEmpty} onClick={onDelete} type="button">
          Delete
        </button>
      </div>
    </section>
  );
}

function ScenarioSlot({
  description,
  label,
  onLoad,
  onReset,
  slot,
}: {
  description: string;
  label: string;
  onLoad: () => void;
  onReset: () => void;
  slot: SaveSlotSummary;
}) {
  return (
    <section className="save-slot">
      <div>
        <strong>{label}</strong>
        <small>{description}</small>
        {slot.isEmpty ? (
          <small>Scenario save is missing</small>
        ) : (
          <small>
            {slot.metadata
              ? `${slot.metadata.calendarLabel}; ${slot.metadata.difficultyLabel ?? "Unknown"}; cash $${slot.metadata.cash.toLocaleString()}; alerts ${slot.metadata.activeAlertCount}`
              : "Metadata unavailable"}
          </small>
        )}
        {slot.error ? <small className="save-slot-error">{slot.error}</small> : null}
      </div>
      <div className="save-slot-actions">
        <button onClick={onLoad} type="button">
          Load
        </button>
        <button onClick={onReset} type="button">
          Reset
        </button>
      </div>
    </section>
  );
}

function formatSlotName(slotId: string): string {
  return slotId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSavedAt(savedAt: string | null): string {
  if (!savedAt) {
    return "unknown";
  }

  return new Date(savedAt).toLocaleString();
}
