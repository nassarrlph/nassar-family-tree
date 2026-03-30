import React from "react";
import { LayoutNode } from "../types";
import { BOX_WIDTH, H_GAP, nodeBoxHeight } from "../lib/layoutTree";

interface Props {
  nodes: Map<string, LayoutNode>;
}

/**
 * Draws right-angle connectors for a horizontal tree.
 * Parent right-center → horizontal run → vertical rail → child left-center
 */
export const ConnectorLayer: React.FC<Props> = ({ nodes }) => {
  const lines: React.ReactNode[] = [];

  nodes.forEach((parent) => {
    if (parent.children.length === 0) return;

    const childNodes = parent.children
      .map((c) => nodes.get(c.id))
      .filter(Boolean) as LayoutNode[];

    if (childNodes.length === 0) return;

    // Parent exit point: right-center
    const px = parent.x + BOX_WIDTH;
    const py = parent.y + nodeBoxHeight(parent) / 2;

    // Midpoint X between parent right and first child left
    const midX = px + H_GAP / 2;

    // Horizontal run from parent to mid column
    lines.push(
      <line
        key={`hrun-${parent.id}`}
        x1={px} y1={py}
        x2={midX} y2={py}
        stroke={parent.branchColor}
        strokeWidth={1.5}
      />
    );

    // Vertical rail at midX — spans from parent Y to the range of all children
    const childCenterYs = childNodes.map((c) => c.y + nodeBoxHeight(c) / 2);
    const topY = Math.min(py, ...childCenterYs);
    const botY = Math.max(py, ...childCenterYs);

    if (topY !== botY) {
      lines.push(
        <line
          key={`vrail-${parent.id}`}
          x1={midX} y1={topY}
          x2={midX} y2={botY}
          stroke={parent.branchColor}
          strokeWidth={1.5}
        />
      );
    }

    // Horizontal run from mid column to each child left-center
    childNodes.forEach((child) => {
      const cy = child.y + nodeBoxHeight(child) / 2;
      const cx = child.x;
      lines.push(
        <line
          key={`hchild-${child.id}`}
          x1={midX} y1={cy}
          x2={cx} y2={cy}
          stroke={child.branchColor}
          strokeWidth={1.5}
        />
      );
    });
  });

  return <g>{lines}</g>;
};
