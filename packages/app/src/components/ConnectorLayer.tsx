import React from "react";
import { LayoutNode, CrossLink } from "../types";
import { BOX_WIDTH, H_GAP, nodeBoxHeight } from "../lib/layoutTree";

interface Props {
  nodes: Map<string, LayoutNode>;
  crossLinks?: CrossLink[];
}

/**
 * Draws right-angle connectors for a horizontal tree,
 * plus dashed cross-link lines for cross-branch marriages.
 */
export const ConnectorLayer: React.FC<Props> = ({ nodes, crossLinks = [] }) => {
  const lines: React.ReactNode[] = [];

  // Regular tree connectors
  nodes.forEach((parent) => {
    if (parent.children.length === 0) return;

    const childNodes = parent.children
      .map((c) => nodes.get(c.id))
      .filter(Boolean) as LayoutNode[];

    if (childNodes.length === 0) return;

    const px = parent.x + BOX_WIDTH;
    const py = parent.y + nodeBoxHeight(parent) / 2;
    const midX = px + H_GAP / 2;

    lines.push(
      <line key={`hrun-${parent.id}`}
        x1={px} y1={py} x2={midX} y2={py}
        stroke={parent.branchColor} strokeWidth={1.5} />
    );

    const childCenterYs = childNodes.map((c) => c.y + nodeBoxHeight(c) / 2);
    const topY = Math.min(py, ...childCenterYs);
    const botY = Math.max(py, ...childCenterYs);

    if (topY !== botY) {
      lines.push(
        <line key={`vrail-${parent.id}`}
          x1={midX} y1={topY} x2={midX} y2={botY}
          stroke={parent.branchColor} strokeWidth={1.5} />
      );
    }

    childNodes.forEach((child) => {
      const cy = child.y + nodeBoxHeight(child) / 2;
      lines.push(
        <line key={`hchild-${child.id}`}
          x1={midX} y1={cy} x2={child.x} y2={cy}
          stroke={child.branchColor} strokeWidth={1.5} />
      );
    });
  });

  // Cross-link connectors — disabled for now
  // crossLinks.forEach((link) => { ... });

  return <g>{lines}</g>;
};
