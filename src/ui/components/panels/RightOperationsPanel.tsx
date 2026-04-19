import { useUiStore } from "../../store/uiStore";

export function RightOperationsPanel() {
  const hoveredTile = useUiStore((state) => state.hoveredTile);
  const selectedTile = useUiStore((state) => state.selectedTile);
  const inspectedTile = selectedTile ?? hoveredTile;

  return (
    <aside className="right-panel" aria-label="Operations">
      <strong>Operations</strong>
      <p>{selectedTile ? "Selected tile" : "Hover tile"}</p>
      {inspectedTile ? (
        <dl>
          <dt>Position</dt>
          <dd>
            {inspectedTile.x}, {inspectedTile.y}
          </dd>
          <dt>Zone</dt>
          <dd>{inspectedTile.zoneType}</dd>
          <dt>Zone ID</dt>
          <dd>{inspectedTile.zoneId ?? "none"}</dd>
          <dt>Storage valid</dt>
          <dd>{inspectedTile.validForStorage ? "yes" : "no"}</dd>
          <dt>Invalid reason</dt>
          <dd>{inspectedTile.invalidReason ?? "none"}</dd>
          <dt>Nearest travel</dt>
          <dd>
            {inspectedTile.nearestTravelDistance === null
              ? "none"
              : `${inspectedTile.nearestTravelDistance} tiles`}
          </dd>
          <dt>Protected dock edge</dt>
          <dd>{inspectedTile.isDockEdge ? "yes" : "no"}</dd>
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
