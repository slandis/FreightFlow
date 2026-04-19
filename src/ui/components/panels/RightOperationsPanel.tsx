import { useUiStore } from "../../store/uiStore";

export function RightOperationsPanel() {
  const hoveredTile = useUiStore((state) => state.hoveredTile);
  const selectedTile = useUiStore((state) => state.selectedTile);

  return (
    <aside className="right-panel" aria-label="Operations">
      <strong>Operations</strong>
      <p>Selected tile</p>
      {selectedTile ? (
        <dl>
          <dt>Position</dt>
          <dd>
            {selectedTile.x}, {selectedTile.y}
          </dd>
          <dt>Zone</dt>
          <dd>{selectedTile.zoneType}</dd>
          <dt>Protected dock edge</dt>
          <dd>{selectedTile.isDockEdge ? "yes" : "no"}</dd>
        </dl>
      ) : (
        <p>Click a warehouse tile.</p>
      )}
      <p>
        Hover:{" "}
        {hoveredTile
          ? `${hoveredTile.x}, ${hoveredTile.y} (${hoveredTile.zoneType})`
          : "none"}
      </p>
    </aside>
  );
}
