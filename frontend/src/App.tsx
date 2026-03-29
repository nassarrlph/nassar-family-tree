import React, { useEffect } from "react";
import { useTreeStore } from "./store";
import { TreeCanvas } from "./components/TreeCanvas";
import { InspectorPanel } from "./components/InspectorPanel";
import { findNode } from "./lib/treeUtils";

export default function App() {
  const { tree, selectedId, loading, saving, error, loadTree, persistTree, selectNode } =
    useTreeStore();

  useEffect(() => {
    loadTree();
  }, []);

  const selectedNode = tree && selectedId ? findNode(tree, selectedId) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <span style={{ fontWeight: "bold", fontSize: 15, color: "#222" }}>Family Tree</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {error && <span style={{ color: "#dc2626", fontSize: 12 }}>{error}</span>}
          <button onClick={loadTree} style={toolBtn} title="Reload from server">
            ↺ Reload
          </button>
          <button
            onClick={persistTree}
            style={{ ...toolBtn, background: "#1d4ed8", color: "white", borderColor: "#1d4ed8" }}
            disabled={saving}
          >
            {saving ? "Saving…" : "💾 Save"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
            Loading…
          </div>
        )}
        {!loading && tree && (
          <TreeCanvas tree={tree} selectedId={selectedId} onSelect={selectNode} />
        )}

        {selectedNode && <InspectorPanel key={selectedNode.id} node={selectedNode} />}

        {!selectedNode && !loading && (
          <div style={hintStyle}>
            <p>Click a couple box to select and edit it.</p>
            <p style={{ fontSize: 11, color: "#aaa" }}>Scroll to zoom · Drag to pan</p>
          </div>
        )}
      </div>
    </div>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  borderBottom: "1px solid #e0e0e0",
  background: "white",
  height: 44,
};

const toolBtn: React.CSSProperties = {
  padding: "5px 12px",
  fontSize: 12,
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "white",
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = {
  width: 220,
  minWidth: 220,
  padding: 16,
  borderLeft: "1px solid #e0e0e0",
  background: "white",
  color: "#888",
  fontSize: 12,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
};
