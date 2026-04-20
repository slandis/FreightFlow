import { TileZoneType } from "../../../game/simulation/types/enums";
import type { ActiveTool, OverlayMode } from "../../store/uiStore";
import { useUiStore } from "../../store/uiStore";
import { MetricTooltip } from "../tooltips/MetricTooltip";

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

const overlays: Array<{ id: OverlayMode; label: string; description: string }> = [
  {
    id: "invalid-storage",
    label: "Invalid Storage",
    description: "Hatch storage that cannot operate.",
  },
  {
    id: "zone-types",
    label: "Zone Types",
    description: "Outline all painted operational zones.",
  },
  {
    id: "travel-network",
    label: "Travel Network",
    description: "Highlight access lanes used by storage.",
  },
  {
    id: "storage-capacity",
    label: "Capacity",
    description: "Tint storage by current utilization.",
  },
  {
    id: "door-utilization",
    label: "Doors",
    description: "Show door mode and activity.",
  },
  {
    id: "queue-pressure",
    label: "Queue Pressure",
    description: "Mark dock and queue pressure points.",
  },
  {
    id: "none",
    label: "None",
    description: "Hide diagnostic overlays.",
  },
];

export function LeftToolPanel() {
  const activeTool = useUiStore((state) => state.activeTool);
  const activeOverlayMode = useUiStore((state) => state.activeOverlayMode);
  const setActiveTool = useUiStore((state) => state.setActiveTool);
  const setActiveOverlayMode = useUiStore((state) => state.setActiveOverlayMode);

  return (
    <aside className="left-panel" aria-label="Zone tools">
      <strong>Tools</strong>
      <div className="tool-group" aria-label="Paint and door tools">
        {tools.map((tool) => (
          <MetricTooltip content={tool.description} key={tool.id} label={tool.label}>
            <button
              className={tool.id === activeTool ? "active" : ""}
              onClick={() => setActiveTool(tool.id)}
              type="button"
            >
              <span>{tool.label}</span>
              <small>{tool.description}</small>
            </button>
          </MetricTooltip>
        ))}
      </div>
      <strong>Overlays</strong>
      <div className="overlay-control-grid" aria-label="Map overlays">
        {overlays.map((overlay) => (
          <MetricTooltip content={overlay.description} key={overlay.id} label={overlay.label}>
            <button
              className={overlay.id === activeOverlayMode ? "active" : ""}
              onClick={() => setActiveOverlayMode(overlay.id)}
              type="button"
            >
              <span>{overlay.label}</span>
            </button>
          </MetricTooltip>
        ))}
      </div>
    </aside>
  );
}
