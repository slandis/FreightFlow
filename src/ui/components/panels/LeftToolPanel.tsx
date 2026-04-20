import { TileZoneType } from "../../../game/simulation/types/enums";
import type { ActiveTool } from "../../store/uiStore";
import { useUiStore } from "../../store/uiStore";

const tools: Array<{ id: ActiveTool; label: string; description: string }> = [
  {
    id: "select",
    label: "Select",
    description: "Inspect tiles and zones",
  },
  {
    id: TileZoneType.Travel,
    label: "Travel",
    description: "Operational access lanes",
  },
  {
    id: TileZoneType.StandardStorage,
    label: "Standard Storage",
    description: "General freight",
  },
  {
    id: TileZoneType.BulkStorage,
    label: "Bulk Storage",
    description: "High-volume freight",
  },
  {
    id: TileZoneType.FastTurnStorage,
    label: "Fast-Turn Storage",
    description: "Small quick-moving freight",
  },
  {
    id: TileZoneType.OversizeStorage,
    label: "Oversize Storage",
    description: "Irregular freight",
  },
  {
    id: TileZoneType.SpecialHandlingStorage,
    label: "Special Handling",
    description: "Care-sensitive freight",
  },
  {
    id: "erase",
    label: "Erase",
    description: "Return tiles to unassigned",
  },
  {
    id: "door-flex",
    label: "Flex Door",
    description: "Place inbound/outbound dock door",
  },
  {
    id: "door-inbound",
    label: "Inbound Door",
    description: "Place receiving-only dock door",
  },
  {
    id: "door-outbound",
    label: "Outbound Door",
    description: "Place shipping-only dock door",
  },
  {
    id: "door-remove",
    label: "Remove Door",
    description: "Remove idle dock doors",
  },
];

export function LeftToolPanel() {
  const activeTool = useUiStore((state) => state.activeTool);
  const setActiveTool = useUiStore((state) => state.setActiveTool);

  return (
    <aside className="left-panel" aria-label="Zone tools">
      <strong>Tools</strong>
      {tools.map((tool) => (
        <button
          className={tool.id === activeTool ? "active" : ""}
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          type="button"
        >
          <span>{tool.label}</span>
          <small>{tool.description}</small>
        </button>
      ))}
    </aside>
  );
}
