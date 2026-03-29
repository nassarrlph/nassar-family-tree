import React from "react";
import { LayoutNode } from "../types";
import { BOX_WIDTH, BOX_HEIGHT } from "../lib/layoutTree";

interface Props {
  nodes: Map<string, LayoutNode>;
}

/**
 * Draws right-angle connectors from each parent box to its children.
 * Parent bottom-center → horizontal rail → child top-center
 */
export const ConnectorLayer: React.FC<Props> = ({ nodes }) => {
  const lines: React.ReactNode[] = [];

  nodes.forEach((parent) => {
    if (parent.children.length === 0) return;

    const px = parent.x + BOX_WIDTH / 2;
    const py = parent.y + BOX_HEIGHT;

    // Midpoint Y between parent bottom and first child top
    const firstChild = nodes.get(parent.children[0].id);
    if (!firstChild) return;
    const midY = py + (firstChild.y - py) / 2;

    // Vertical drop from parent
    lines.push(
      <line
        key={`vdrop-${parent.id}`}
        x1={px} y1={py}
        x2={px} y2={midY}
        stroke={parent.branchColor}
        strokeWidth={1.5}
      />
    );

    // Horizontal rail across all children
    const childNodes = parent.children
      .map((c) => nodes.get(c.id))
      .filter(Boolean) as LayoutNode[];

    if (childNodes.length > 1) {
      const leftX = childNodes[0].x + BOX_WIDTH / 2;
      const rightX = childNodes[childNodes.length - 1].x + BOX_WIDTH / 2;
      lines.push(
        <line
          key={`rail-${parent.id}`}
          x1={leftX} y1={midY}
          x2={rightX} y2={midY}
          stroke={parent.branchColor}
          strokeWidth={1.5}
        />
      );
    }

    // Vertical drop to each child
    childNodes.forEach((child) => {
      const cx = child.x + BOX_WIDTH / 2;
      const cy = child.y;
      const color = child.branchColor;
      lines.push(
        <line
          key={`vup-${child.id}`}
          x1={cx} y1={midY}
          x2={cx} y2={cy}
          stroke={color}
          strokeWidth={1.5}
        />
      );
    });
  });

  return <g>{lines}</g>;
};
