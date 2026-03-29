import { CoupleNode, LayoutNode } from "../types";

export const BOX_WIDTH = 130;
export const BOX_HEIGHT = 52;
export const H_GAP = 60;   // horizontal gap between generations (left → right)
export const V_GAP = 16;   // vertical gap between siblings

/**
 * Horizontal layout: root on the left, children expand to the right.
 * Each generation is a new column; siblings are stacked vertically.
 *
 * Returns a flat map of nodeId -> LayoutNode with absolute x, y positions.
 */
export function computeLayout(root: CoupleNode): Map<string, LayoutNode> {
  const map = new Map<string, LayoutNode>();

  // First pass: compute subtree HEIGHT bottom-up (in the vertical/sibling axis)
  function subtreeHeight(node: CoupleNode): number {
    if (node.children.length === 0) return BOX_HEIGHT;
    const childrenTotal =
      node.children.reduce((sum, c) => sum + subtreeHeight(c), 0) +
      V_GAP * (node.children.length - 1);
    return Math.max(BOX_HEIGHT, childrenTotal);
  }

  // Second pass: assign x (generation), y (sibling position) top-down
  function assign(node: CoupleNode, x: number, y: number) {
    const sh = subtreeHeight(node);
    // Center this node vertically within its subtree height
    const cy = y + sh / 2 - BOX_HEIGHT / 2;

    const xOff = node.layout?.xOffset ?? 0;
    const yOff = node.layout?.yOffset ?? 0;

    const layoutNode: LayoutNode = {
      ...node,
      x: x + xOff,
      y: cy + yOff,
      subtreeWidth: sh, // reusing subtreeWidth field to mean subtree height in this axis
    };
    map.set(node.id, layoutNode);

    if (node.children.length > 0) {
      const childX = x + BOX_WIDTH + H_GAP;
      let childY = y;
      for (const child of node.children) {
        const csh = subtreeHeight(child);
        assign(child, childX, childY);
        childY += csh + V_GAP;
      }
    }
  }

  assign(root, 0, 0);
  return map;
}
