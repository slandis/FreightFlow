import { useUiStore } from "../../store/uiStore";

const tools = ["select", "travel", "standard-storage", "bulk-storage", "erase"];

export function LeftToolPanel() {
  const activeTool = useUiStore((state) => state.activeTool);
  const setActiveTool = useUiStore((state) => state.setActiveTool);

  return (
    <aside className="left-panel" aria-label="Zone tools">
      <strong>Tools</strong>
      {tools.map((tool) => (
        <button
          className={tool === activeTool ? "active" : ""}
          key={tool}
          onClick={() => setActiveTool(tool)}
          type="button"
        >
          {tool}
        </button>
      ))}
    </aside>
  );
}
