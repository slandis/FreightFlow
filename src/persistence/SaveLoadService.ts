import type { GameState } from "../game/simulation/core/GameState";
import {
  createSavePayload,
  deserializeGameState,
  validateSavePayload,
} from "./GameStateSerializer";
import type { SaveRepository } from "./LocalSaveRepository";
import type { SaveGamePayload, SaveSlotSummary } from "./SaveGameSchema";

export interface SaveLoadSuccess {
  success: true;
  message: string;
}

export interface SaveLoadFailure {
  success: false;
  errors: string[];
}

export type SaveLoadResult = SaveLoadSuccess | SaveLoadFailure;

export class SaveLoadService {
  constructor(
    private readonly repository: SaveRepository,
    private readonly getState: () => GameState,
    private readonly replaceState: (state: GameState) => void,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  save(slotId: string): SaveLoadResult {
    try {
      const payload = createSavePayload(this.getState(), slotId, this.clock());
      this.repository.write(slotId, JSON.stringify(payload));

      return {
        success: true,
        message: `Saved ${slotId}`,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Save failed"],
      };
    }
  }

  load(slotId: string): SaveLoadResult {
    const rawPayload = this.repository.read(slotId);

    if (!rawPayload) {
      return {
        success: false,
        errors: [`No save found in ${slotId}`],
      };
    }

    try {
      const parsed = JSON.parse(rawPayload) as unknown;
      const validation = validateSavePayload(parsed);

      if (!validation.success) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      const savePayload = parsed as SaveGamePayload;
      this.replaceState(deserializeGameState(savePayload.gameState));

      return {
        success: true,
        message: `Loaded ${slotId}`,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Load failed"],
      };
    }
  }

  delete(slotId: string): SaveLoadResult {
    this.repository.remove(slotId);

    return {
      success: true,
      message: `Deleted ${slotId}`,
    };
  }

  hasSave(slotId: string): boolean {
    return this.repository.read(slotId) !== null;
  }

  listSlots(): SaveSlotSummary[] {
    return this.repository.list();
  }
}
