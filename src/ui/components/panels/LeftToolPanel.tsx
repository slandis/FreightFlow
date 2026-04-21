import { useState, type ReactNode } from "react";
import {
  formatCurrencyAmount,
  getDoorPlacementCost,
  getEraseCost,
  getZonePaintCost,
} from "../../../game/simulation/economy/buildCosts";
import { TileZoneType } from "../../../game/simulation/types/enums";
import type { ActiveTool, OverlayMode } from "../../store/uiStore";
import { useUiStore } from "../../store/uiStore";

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
    description: `Return tiles to unassigned · ${formatCurrencyAmount(getEraseCost())}/tile`,
  },
];

const storageOptions: ToolOption[] = [
  {
    id: TileZoneType.Travel,
    label: "Travel",
    description: `Operational access lanes · ${formatCurrencyAmount(
      getZonePaintCost(TileZoneType.Travel),
    )}/tile`,
  },
  {
    id: TileZoneType.StandardStorage,
    label: "Standard Storage",
    description: `General freight · ${formatCurrencyAmount(
      getZonePaintCost(TileZoneType.StandardStorage),
    )}/tile`,
  },
  {
    id: TileZoneType.BulkStorage,
    label: "Bulk Storage",
    description: `High-volume freight · ${formatCurrencyAmount(
      getZonePaintCost(TileZoneType.BulkStorage),
    )}/tile`,
  },
  {
    id: TileZoneType.FastTurnStorage,
    label: "Fast-Turn Storage",
    description: `Small quick-moving freight · ${formatCurrencyAmount(
      getZonePaintCost(TileZoneType.FastTurnStorage),
    )}/tile`,
  },
  {
    id: TileZoneType.OversizeStorage,
    label: "Oversize Storage",
    description: `Irregular freight · ${formatCurrencyAmount(
      getZonePaintCost(TileZoneType.OversizeStorage),
    )}/tile`,
  },
  {
    id: TileZoneType.SpecialHandlingStorage,
    label: "Special Handling",
    description: `Care-sensitive freight · ${formatCurrencyAmount(
      getZonePaintCost(TileZoneType.SpecialHandlingStorage),
    )}/tile`,
  },
];

const doorOptions: ToolOption[] = [
  {
    id: "door-flex",
    label: "Flex Door",
    description: `Place inbound/outbound dock door · ${formatCurrencyAmount(
      getDoorPlacementCost("flex"),
    )} each`,
  },
  {
    id: "door-inbound",
    label: "Inbound Door",
    description: `Place receiving-only dock door · ${formatCurrencyAmount(
      getDoorPlacementCost("inbound"),
    )} each`,
  },
  {
    id: "door-outbound",
    label: "Outbound Door",
    description: `Place shipping-only dock door · ${formatCurrencyAmount(
      getDoorPlacementCost("outbound"),
    )} each`,
  },
  {
    id: "door-remove",
    label: "Remove Door",
    description: "Remove idle dock doors · no refund",
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
  const [openSection, setOpenSection] = useState("tools");

  return (
    <aside className="left-panel" aria-label="Zone tools">
      <strong>Build</strong>
      <LeftPanelSection
        isOpen={openSection === "tools"}
        onToggle={() => setOpenSection((current) => (current === "tools" ? "" : "tools"))}
        title="Tools"
      >
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
      <LeftPanelSection
        isOpen={openSection === "storage"}
        onToggle={() => setOpenSection((current) => (current === "storage" ? "" : "storage"))}
        title="Storage"
      >
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
      <LeftPanelSection
        isOpen={openSection === "doors"}
        onToggle={() => setOpenSection((current) => (current === "doors" ? "" : "doors"))}
        title="Doors"
      >
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
      <LeftPanelSection
        isOpen={openSection === "overlays"}
        onToggle={() => setOpenSection((current) => (current === "overlays" ? "" : "overlays"))}
        title="Overlays"
      >
        <div className="overlay-control-grid" aria-label="Map overlays">
          {overlays.map((overlay) => (
            <button
              className={overlay.id === activeOverlayMode ? "active" : ""}
              key={overlay.id}
              onClick={() => setActiveOverlayMode(overlay.id)}
              type="button"
            >
              <span>{overlay.label}</span>
            </button>
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
    <button className={active ? "active" : ""} onClick={onClick} type="button">
      <span>{tool.label}</span>
      <small>{tool.description}</small>
    </button>
  );
}

function LeftPanelSection({
  children,
  isOpen,
  onToggle,
  title,
}: {
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <section className={`left-panel-section ${isOpen ? "open" : ""}`}>
      <button
        aria-expanded={isOpen}
        className="left-panel-section-toggle"
        onClick={onToggle}
        type="button"
      >
        <span>{title}</span>
        <span className="left-panel-section-state">{isOpen ? "Hide" : "Show"}</span>
      </button>
      {isOpen ? <div className="left-panel-section-body">{children}</div> : null}
    </section>
  );
}
