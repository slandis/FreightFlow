import {
  createEmptySlotSummary,
  SAVE_SLOT_IDS,
  type SaveGamePayload,
  type SaveSlotSummary,
} from "./SaveGameSchema";

export interface StorageAdapter {
  readonly length: number;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface SaveRepository {
  list(): SaveSlotSummary[];
  read(slotId: string): string | null;
  remove(slotId: string): void;
  write(slotId: string, payload: string): void;
}

const SAVE_KEY_PREFIX = "freightflow.save.";

export class LocalSaveRepository implements SaveRepository {
  constructor(private readonly storage: StorageAdapter = window.localStorage) {}

  write(slotId: string, payload: string): void {
    this.storage.setItem(this.getKey(slotId), payload);
  }

  read(slotId: string): string | null {
    return this.storage.getItem(this.getKey(slotId));
  }

  remove(slotId: string): void {
    this.storage.removeItem(this.getKey(slotId));
  }

  list(): SaveSlotSummary[] {
    const slotIds = new Set<string>(SAVE_SLOT_IDS);

    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);

      if (key?.startsWith(SAVE_KEY_PREFIX)) {
        slotIds.add(key.slice(SAVE_KEY_PREFIX.length));
      }
    }

    return [...slotIds].sort().map((slotId) => this.createSlotSummary(slotId));
  }

  private getKey(slotId: string): string {
    return `${SAVE_KEY_PREFIX}${slotId}`;
  }

  private createSlotSummary(slotId: string): SaveSlotSummary {
    const payload = this.read(slotId);

    if (!payload) {
      return createEmptySlotSummary(slotId);
    }

    try {
      const parsed = JSON.parse(payload) as Partial<SaveGamePayload>;

      return {
        slotId,
        isEmpty: false,
        savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : null,
        metadata: parsed.metadata ?? null,
        error: parsed.metadata ? null : "Save metadata is missing",
      };
    } catch {
      return {
        slotId,
        isEmpty: false,
        savedAt: null,
        metadata: null,
        error: "Save payload is malformed",
      };
    }
  }
}
