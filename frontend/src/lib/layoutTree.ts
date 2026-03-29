import { CoupleNode, LayoutNode } from "../types";

export const BOX_WIDTH = 130;
export const BOX_HEIGHT = 52;
export const H_GAP = 24;   // horizontal gap between siblings
export const V_GAP = 70;   // vertical gap between generations

/**
 * Computes layout for the entire tree.
 * Returns a flat map of nodeId -> LayoutNode with absolute x, y positions.
 */
export function computeLayout(root: CoupleNode): Map<string, LayoutNode> {
  const map = new Map<string, LayoutNode>();

  // First pass: compute subtree widths bottom-up
  function subtreeWidth(node: CoupleNode): number {
    if (node.children.length === 0) return BOX_WIDTH;
    const childrenTotal =
      node.children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
      H_GAP * (node.children.length - 1);
    return Math.max(BOX_WIDTH, childrenTotal);
  }

  // Second pass: assign x, y top-down
  function assign(node: CoupleNode, x: number, y: number) {
    const sw = subtreeWidth(node);
    const cx = x + sw / 2 - BOX_WIDTH / 2;
    const xOff = node.layout?.xOffset ?? 0;
    const yOff = node.layout?.yOffset ?? 0;

    const layoutNode: LayoutNode = {
      ...node,
      x: cx + xOff,
      y: y + yOff,
      subtreeWidth: sw,
    };
    map.set(node.id, layoutNode);

    if (node.children.length > 0) {
      const childY = y + BOX_HEIGHT + V_GAP;
      let childX = x;
      for (const child of node.children) {
        const csw = subtreeWidth(child);
        assign(child, childX, childY);
        childX += csw + H_GAP;
      }
    }
  }

  assign(root, 0, 0);
  return map;
}
