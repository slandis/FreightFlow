import type { Command, CommandContext, CommandResult } from "../commands/Command";

export class CommandBus {
  constructor(private readonly context: CommandContext) {}

  dispatch(command: Command): CommandResult {
    const result = command.execute(this.context);

    if (result.success) {
      this.context.state.debug.lastCommandType = command.type;
    }

    for (const event of result.events) {
      this.context.state.debug.lastEventType = event.type;
      this.context.eventBus.emit(event);
    }

    return result;
  }
}
