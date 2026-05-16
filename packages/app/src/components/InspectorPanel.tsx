import React, { useEffect, useState } from "react";
import { CoupleNode, DescendantSide } from "../types";
import { useTreeStore } from "../store";

interface Props {
  node: CoupleNode;
}

export const InspectorPanel: React.FC<Props> = ({ node }) => {
  const { updateNode, addChild, deleteNode, tree } = useTreeStore();
  const isRoot = tree?.id === node.id;

  const [fatherName, setFatherName] = useState(node.father.name);
  const [motherName, setMotherName] = useState(node.mother.name);
  const [descendantSide, setDescendantSide] = useState<DescendantSide>(node.descendantSide);
  const [branchColor, setBranchColor] = useState(node.branchColor);

  // Sync when selected node changes
  useEffect(() => {
    setFatherName(node.father.name);
    setMotherName(node.mother.name);
    setDescendantSide(node.descendantSide);
    setBranchColor(node.branchColor);
  }, [node.id]);

  const handleSave = () => {
    updateNode(node.id, {
      father: { ...node.father, name: fatherName },
      mother: { ...node.mother, name: motherName },
      descendantSide,
      branchColor,
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${fatherName} & ${motherName}" and all descendants?`)) {
      deleteNode(node.id);
    }
  };

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#333" }}>Edit Couple</h3>

      <label style={labelStyle}>Father</label>
      <input
        style={inputStyle}
        value={fatherName}
        onChange={(e) => setFatherName(e.target.value)}
      />

      <label style={labelStyle}>Mother</label>
      <input
        style={inputStyle}
        value={motherName}
        onChange={(e) => setMotherName(e.target.value)}
      />

      <label style={labelStyle}>Descendant side</label>
      <select
        style={inputStyle}
        value={descendantSide}
        onChange={(e) => setDescendantSide(e.target.value as DescendantSide)}
      >
        <option value="none">None</option>
        <option value="father">Father</option>
        <option value="mother">Mother</option>
        <option value="both">Both</option>
      </select>

      <label style={labelStyle}>Branch color</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          type="color"
          value={branchColor}
          onChange={(e) => setBranchColor(e.target.value)}
          style={{ width: 40, height: 32, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}
        />
        <input
          style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          value={branchColor}
          onChange={(e) => setBranchColor(e.target.value)}
        />
      </div>

      <button onClick={handleSave} style={primaryBtn}>Apply changes</button>

      <hr style={{ margin: "12px 0", borderColor: "#eee" }} />

      <button onClick={() => addChild(node.id)} style={secondaryBtn}>
        + Add child couple
      </button>

      {!isRoot && (
        <button onClick={handleDelete} style={dangerBtn}>
          Delete node
        </button>
      )}
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  width: 220,
  minWidth: 220,
  padding: 16,
  borderLeft: "1px solid #e0e0e0",
  background: "white",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#666",
  marginBottom: 3,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 7px",
  fontSize: 12,
  border: "1px solid #ccc",
  borderRadius: 4,
  marginBottom: 10,
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "7px 0",
  background: "#1d4ed8",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  marginBottom: 6,
};

const secondaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "7px 0",
  background: "#f0f0f0",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  marginBottom: 6,
};

const dangerBtn: React.CSSProperties = {
  width: "100%",
  padding: "7px 0",
  background: "white",
  color: "#dc2626",
  border: "1px solid #dc2626",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  marginTop: 4,
};
