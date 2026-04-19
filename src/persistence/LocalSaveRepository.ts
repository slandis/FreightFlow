export class LocalSaveRepository {
  write(slotId: string, payload: string): void {
    window.localStorage.setItem(this.getKey(slotId), payload);
  }

  read(slotId: string): string | null {
    return window.localStorage.getItem(this.getKey(slotId));
  }

  private getKey(slotId: string): string {
    return `freightflow.save.${slotId}`;
  }
}
