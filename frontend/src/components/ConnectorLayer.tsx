import React from "react";
import { LayoutNode } from "../types";
import { BOX_WIDTH, BOX_HEIGHT, H_GAP } from "../lib/layoutTree";

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
    const py = parent.y + BOX_HEIGHT / 2;

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

    // Vertical rail spanning all children at midX
    if (childNodes.length > 1) {
      const topY = childNodes[0].y + BOX_HEIGHT / 2;
      const botY = childNodes[childNodes.length - 1].y + BOX_HEIGHT / 2;
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
      const cy = child.y + BOX_HEIGHT / 2;
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
