import { CoupleNode, LayoutNode } from "../types";

export const BOX_WIDTH = 180;
export const H_GAP = 30;
export const V_GAP = 16;

const PADDING = 5;
const FONT_SIZE = 14;
const LINE_H = FONT_SIZE + 6;
const MIN_ROW_H = FONT_SIZE + 12;

/** Estimate character width for Times New Roman at given font size */
function charWidth(fontSize: number) {
  return fontSize * 0.62; // slightly conservative to avoid underestimating wraps
}

/** Wrap a name into lines that fit within maxWidth.
 * Entries prefixed with "N-" (e.g. "1-", "2-") are always split onto their own line.
 */
export function wrapText(text: string, maxWidth: number, fontSize = FONT_SIZE): string[] {
  if (!text.trim()) return [];
  const cw = charWidth(fontSize);

  // First split on explicit newlines or numbered entries like "2- ..."
  const segments = text.split(/(?=\s*\d+-\s)/);

  const lines: string[] = [];
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const words = trimmed.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length * cw > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/** Compute the rendered height of a single name slot (one person) */
function slotHeight(name: string): number {
  const maxWidth = BOX_WIDTH - PADDING * 2;
  const lines = wrapText(name, maxWidth);
  const count = Math.max(1, lines.length);
  return Math.max(MIN_ROW_H, count * LINE_H + 6);
}

/** Compute the total box height for a node based on its names */
export function nodeBoxHeight(node: CoupleNode): number {
  const hasFather = node.father.name.trim() !== "";
  const hasMother = node.mother.name.trim() !== "";
  if (hasFather && hasMother) {
    return slotHeight(node.father.name) + slotHeight(node.mother.name);
  }
  const name = hasFather ? node.father.name : node.mother.name;
  return slotHeight(name);
}

export function computeLayout(root: CoupleNode, collapsedIds: Set<string> = new Set()): Map<string, LayoutNode> {
  const map = new Map<string, LayoutNode>();

  function visibleChildren(node: CoupleNode): CoupleNode[] {
    if (collapsedIds.has(node.id)) return [];
    return node.children;
  }

  function subtreeHeight(node: CoupleNode): number {
    const bh = nodeBoxHeight(node);
    const children = visibleChildren(node);
    if (children.length === 0) return bh;
    const childrenTotal =
      children.reduce((sum, c) => sum + subtreeHeight(c), 0) +
      V_GAP * (children.length - 1);
    return Math.max(bh, childrenTotal);
  }

  function assign(node: CoupleNode, x: number, y: number) {
    const bh = nodeBoxHeight(node);
    const sh = subtreeHeight(node);
    const cy = y + sh / 2 - bh / 2;

    const xOff = node.layout?.xOffset ?? 0;
    const yOff = node.layout?.yOffset ?? 0;

    const layoutNode: LayoutNode = {
      ...node,
      x: x + xOff,
      y: cy + yOff,
      subtreeWidth: sh,
    };
    map.set(node.id, layoutNode);

    const children = visibleChildren(node);
    if (children.length > 0) {
      const childX = x + BOX_WIDTH + H_GAP;
      let childY = y;
      for (const child of children) {
        const csh = subtreeHeight(child);
        assign(child, childX, childY);
        childY += csh + V_GAP;
      }
    }
  }

  assign(root, 0, 0);
  return map;
}
