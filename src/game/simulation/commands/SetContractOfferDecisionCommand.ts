import type { ContractDecision } from "../core/GameState";
import {
  commandFailed,
  commandSucceeded,
  type Command,
  type CommandContext,
} from "./Command";

export class SetContractOfferDecisionCommand
  implements Command<"set-contract-offer-decision">
{
  readonly type = "set-contract-offer-decision";

  constructor(
    private readonly offerId: string,
    private readonly decision: ContractDecision,
  ) {}

  execute(context: CommandContext) {
    if (!context.state.planning.isPlanningActive) {
      return commandFailed("Contract offers can only be updated during monthly planning");
    }

    if (!["undecided", "accepted", "rejected"].includes(this.decision)) {
      return commandFailed(`Invalid contract offer decision: ${this.decision}`);
    }

    const offer = context.state.contracts.pendingOffers.find(
      (candidateOffer) => candidateOffer.id === this.offerId,
    );

    if (!offer) {
      return commandFailed(`Unknown contract offer: ${this.offerId}`);
    }

    offer.decision = this.decision;

    const event = {
      ...context.createEvent("contract-offer-decision-set"),
      offerId: offer.id,
      decision: this.decision,
      monthKey: offer.monthKey,
    };

    return commandSucceeded([event]);
  }
}
