import type { Command, CommandContext } from "./Command";
import { commandSucceeded } from "./Command";

export class SetMonthlyReviewSkipCommand
  implements Command<"set-monthly-review-skip">
{
  readonly type = "set-monthly-review-skip";

  constructor(private readonly skipMonthlyReviews: boolean) {}

  execute(context: CommandContext) {
    context.state.planning.skipMonthlyReviews = this.skipMonthlyReviews;

    return commandSucceeded([context.createEvent("monthly-review-skip-updated")]);
  }
}
