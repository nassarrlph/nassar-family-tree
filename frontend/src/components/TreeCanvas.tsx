import React, { useMemo, useRef, useState, useEffect } from "react";
import { CoupleNode, LayoutNode } from "../types";
import { computeLayout, BOX_WIDTH, BOX_HEIGHT } from "../lib/layoutTree";
import { CoupleBox } from "./CoupleBox";
import { ConnectorLayer } from "./ConnectorLayer";
import { flattenTree } from "../lib/treeUtils";

interface Props {
  tree: CoupleNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const TreeCanvas: React.FC<Props> = ({ tree, selectedId, onSelect }) => {
  const layoutMap = useMemo(() => computeLayout(tree), [tree]);
  const flatNodes = useMemo(
    () => flattenTree(tree).map((n) => layoutMap.get(n.id)!).filter(Boolean),
    [tree, layoutMap]
  );

  // Compute SVG viewBox to fit all nodes
  const padding = 40;
  const xs = flatNodes.map((n) => n.x);
  const ys = flatNodes.map((n) => n.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + BOX_WIDTH + padding;
  const maxY = Math.max(...ys) + BOX_HEIGHT + padding;
  const svgW = maxX - minX;
  const svgH = maxY - minY;

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest("g[data-box]")) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handleMouseUp = () => { dragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.2, z - e.deltaY * 0.001)));
  };

  return (
    <div
      style={{ flex: 1, overflow: "hidden", background: "#f8f8f8", position: "relative" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onClick={() => onSelect(null)}
        style={{ cursor: dragging.current ? "grabbing" : "grab", display: "block" }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <g transform={`translate(${-minX}, ${-minY})`}>
            <ConnectorLayer nodes={layoutMap} />
            {flatNodes.map((node) => (
              <CoupleBox
                key={node.id}
                node={node}
                selected={node.id === selectedId}
                onClick={onSelect}
              />
            ))}
          </g>
        </g>
      </svg>

      {/* Zoom controls */}
      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} style={zoomBtn}>+</button>
        <button onClick={() => setZoom(1)} style={zoomBtn}>⊙</button>
        <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.15))} style={zoomBtn}>−</button>
      </div>
    </div>
  );
};

const zoomBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid #ccc",
  background: "white",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
