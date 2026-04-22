import type { Command, CommandContext } from "./Command";
import { commandSucceeded } from "./Command";

export const PLAYTEST_CASH_AMOUNT = 250000;

export class GrantPlaytestCashCommand
  implements Command<"grant-playtest-cash">
{
  readonly type = "grant-playtest-cash";

  execute(context: CommandContext) {
    context.state.cash = PLAYTEST_CASH_AMOUNT;

    return commandSucceeded([context.createEvent("playtest-cash-granted")]);
  }
}
