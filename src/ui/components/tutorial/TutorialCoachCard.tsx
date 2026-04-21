import { useTutorialCoach } from "../../hooks/useTutorialCoach";
import { useUiStore } from "../../store/uiStore";

export function TutorialCoachCard() {
  const { activeHint, dismissActiveHint } = useTutorialCoach();
  const requestMapFocus = useUiStore((state) => state.requestMapFocus);
  const setActiveOverlayMode = useUiStore((state) => state.setActiveOverlayMode);
  const focusTarget = activeHint?.focusTarget;

  if (!activeHint) {
    return null;
  }

  return (
    <section className="tutorial-coach" aria-label="Tutorial coach">
      <header>
        <span>Coach</span>
        <button onClick={dismissActiveHint} type="button">
          Dismiss
        </button>
      </header>
      <strong>{activeHint.title}</strong>
      <p>{activeHint.body}</p>
      {activeHint.actionLabel && focusTarget ? (
        <button
          className="tutorial-coach-action"
          onClick={() => {
            if (activeHint.overlayMode) {
              setActiveOverlayMode(activeHint.overlayMode);
            }

            requestMapFocus({
              reason: focusTarget.label,
              x: focusTarget.x,
              y: focusTarget.y,
              zoom: 0.94,
            });
          }}
          type="button"
        >
          {activeHint.actionLabel}
        </button>
      ) : null}
    </section>
  );
}
