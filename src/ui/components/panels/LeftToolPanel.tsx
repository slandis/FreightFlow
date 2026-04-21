import { useState, type ReactNode } from "react";
import { TileZoneType } from "../../../game/simulation/types/enums";
import type { ActiveTool, OverlayMode } from "../../store/uiStore";
import { useUiStore } from "../../store/uiStore";
import { MetricTooltip } from "../tooltips/MetricTooltip";

interface ToolOption {
  id: ActiveTool;
  label: string;
  description: string;
}

const toolOptions: ToolOption[] = [
  {
    id: "select",
    label: "Select",
    description: "Inspect tiles and zones",
  },
  {
    id: "erase",
    label: "Erase",
    description: "Return tiles to unassigned",
  },
];

const storageOptions: ToolOption[] = [
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
];

const doorOptions: ToolOption[] = [
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
      <strong>Build</strong>
      <LeftPanelSection defaultOpen title="Tools">
        <div className="tool-group" aria-label="Primary tools">
          {toolOptions.map((tool) => (
            <ToolButton
              active={tool.id === activeTool}
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              tool={tool}
            />
          ))}
        </div>
      </LeftPanelSection>
      <LeftPanelSection defaultOpen title="Storage">
        <div className="tool-group" aria-label="Storage assignment tools">
          {storageOptions.map((tool) => (
            <ToolButton
              active={tool.id === activeTool}
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              tool={tool}
            />
          ))}
        </div>
      </LeftPanelSection>
      <LeftPanelSection title="Doors">
        <div className="tool-group" aria-label="Door assignment tools">
          {doorOptions.map((tool) => (
            <ToolButton
              active={tool.id === activeTool}
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              tool={tool}
            />
          ))}
        </div>
      </LeftPanelSection>
      <LeftPanelSection title="Overlays">
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
      </LeftPanelSection>
    </aside>
  );
}

function ToolButton({
  active,
  onClick,
  tool,
}: {
  active: boolean;
  onClick: () => void;
  tool: ToolOption;
}) {
  return (
    <MetricTooltip content={tool.description} label={tool.label}>
      <button className={active ? "active" : ""} onClick={onClick} type="button">
        <span>{tool.label}</span>
        <small>{tool.description}</small>
      </button>
    </MetricTooltip>
  );
}

function LeftPanelSection({
  children,
  defaultOpen = false,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`left-panel-section ${isOpen ? "open" : ""}`}>
      <button
        aria-expanded={isOpen}
        className="left-panel-section-toggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{title}</span>
        <span className="left-panel-section-state">{isOpen ? "Hide" : "Show"}</span>
      </button>
      {isOpen ? <div className="left-panel-section-body">{children}</div> : null}
    </section>
  );
}
