import React, { useMemo, useRef, useState, useEffect } from "react";
import { CoupleNode } from "../types";
import { computeLayout } from "../lib/layoutTree";
import { CoupleBox } from "./CoupleBox";
import { ConnectorLayer } from "./ConnectorLayer";
import { flattenTree } from "../lib/treeUtils";
import { useTreeStore } from "../store";

interface Props {
  tree: CoupleNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const TreeCanvas: React.FC<Props> = ({ tree, selectedId, onSelect }) => {
  const { collapsedIds, toggleCollapse, collapseAll, expandAll } = useTreeStore();

  const layoutMap = useMemo(() => computeLayout(tree, collapsedIds), [tree, collapsedIds]);

  const flatNodes = useMemo(
    () => flattenTree(tree).map((n) => layoutMap.get(n.id)!).filter(Boolean),
    [tree, layoutMap]
  );

  const padding = 40;
  const allNodes = useMemo(() => Array.from(layoutMap.values()), [layoutMap]);
  const minX = Math.min(...allNodes.map((n) => n.x)) - padding;
  const minY = Math.min(...allNodes.map((n) => n.y)) - padding;

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Before toggling collapse, snapshot the node's current canvas position.
  // After layout recomputes, we adjust pan so that node stays at the same screen coords.
  const anchorRef = useRef<{ id: string; screenX: number; screenY: number } | null>(null);

  const handleToggleCollapse = (id: string) => {
    const node = layoutMap.get(id);
    if (!node) { toggleCollapse(id); return; }

    // Node's current screen position
    const nodeCanvasX = node.x - minX;
    const nodeCanvasY = node.y - minY;
    const screenX = nodeCanvasX * zoom + pan.x;
    const screenY = nodeCanvasY * zoom + pan.y;

    anchorRef.current = { id, screenX, screenY };
    toggleCollapse(id);
  };

  // After layoutMap changes (collapse toggled), compensate pan
  const prevLayoutMinX = useRef(minX);
  const prevLayoutMinY = useRef(minY);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchorRef.current = null;

    const node = layoutMap.get(anchor.id);
    if (!node) return;

    const nodeCanvasX = node.x - minX;
    const nodeCanvasY = node.y - minY;
    const newScreenX = nodeCanvasX * zoom + pan.x;
    const newScreenY = nodeCanvasY * zoom + pan.y;

    const dx = anchor.screenX - newScreenX;
    const dy = anchor.screenY - newScreenY;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  }, [layoutMap]);

  // Zoom toward a specific screen point
  const zoomToward = (delta: number, screenX: number, screenY: number) => {
    setZoom((z) => {
      const newZ = Math.min(3, Math.max(0.2, z + delta));
      const scale = newZ / z;
      setPan((p) => ({
        x: screenX - scale * (screenX - p.x),
        y: screenY - scale * (screenY - p.y),
      }));
      return newZ;
    });
  };

  // Zoom toward canvas center (for buttons)
  const zoomCentered = (delta: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 0;
    const cy = rect ? rect.height / 2 : 0;
    zoomToward(delta, cx, cy);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest("g[data-box]")) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handleMouseUp = () => { dragging.current = false; };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        setZoom((z) => {
          const newZ = Math.min(3, Math.max(0.2, z - e.deltaY * 0.005 * z));
          const scale = newZ / z;
          setPan((p) => ({
            x: mouseX - scale * (mouseX - p.x),
            y: mouseY - scale * (mouseY - p.y),
          }));
          return newZ;
        });
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === "=" || e.key === "+") { e.preventDefault(); zoomToward(0.15, mousePos.current.x, mousePos.current.y); }
      if (e.key === "-")                  { e.preventDefault(); zoomToward(-0.15, mousePos.current.x, mousePos.current.y); }
      if (e.key === "0")                  { e.preventDefault(); setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: "hidden", background: "#f8f8f8", position: "relative" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width="100%"
        height="100%"
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
                collapsed={collapsedIds.has(node.id)}
                onClick={onSelect}
                onToggleCollapse={handleToggleCollapse}
              />
            ))}
          </g>
        </g>
      </svg>

      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <button onClick={() => expandAll()} style={ctrlBtn} title="Expand all">⊞ Expand all</button>
        <button onClick={() => collapseAll(tree)} style={ctrlBtn} title="Collapse all">⊟ Collapse all</button>
        <div style={{ height: 8 }} />
        <button onClick={() => zoomCentered(0.15)} style={ctrlBtn}>+</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={ctrlBtn}>⊙</button>
        <button onClick={() => zoomCentered(-0.15)} style={ctrlBtn}>−</button>
      </div>
    </div>
  );
};

const ctrlBtn: React.CSSProperties = {
  height: 32,
  padding: "0 10px",
  border: "1px solid #ccc",
  background: "white",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  gap: 4,
};
