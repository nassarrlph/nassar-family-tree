import React from "react";
import { LayoutNode } from "../types";
import { BOX_WIDTH, wrapText, nodeBoxHeight } from "../lib/layoutTree";

interface Props {
  node: LayoutNode;
  selected: boolean;
  collapsed: boolean;
  onClick: (id: string) => void;
  onToggleCollapse: (id: string) => void;
}

const PADDING = 5;
const FONT_SIZE = 14;
const LINE_H = FONT_SIZE + 6;
const FONT_FAMILY = "'Times New Roman', Times, serif";
const TOGGLE_R = 8;

function renderLines(
  lines: string[],
  x: number,
  slotY: number,
  slotH: number,
  highlight: boolean,
  bold: boolean,
  clipId: string
) {
  const totalTextH = lines.length * LINE_H;
  const startY = slotY + (slotH - totalTextH) / 2 + FONT_SIZE;
  return (
    <g clipPath={`url(#${clipId})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + PADDING}
          y={startY + i * LINE_H}
          fontSize={FONT_SIZE}
          fontFamily={FONT_FAMILY}
          fill={highlight ? "#111" : "#333"}
          fontWeight={bold ? "bold" : "normal"}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export const CoupleBox: React.FC<Props> = ({ node, selected, collapsed, onClick, onToggleCollapse }) => {
  const { x, y, father, mother, descendantSide, branchColor, children } = node;

  const hasFather = father.name.trim() !== "";
  const hasMother = mother.name.trim() !== "";
  const isCouple = hasFather && hasMother;
  const hasChildren = children.length > 0;

  const fatherHighlight = descendantSide === "father" || descendantSide === "both";
  const motherHighlight = descendantSide === "mother" || descendantSide === "both";

  const borderColor = selected ? "#1d4ed8" : branchColor;
  const borderWidth = selected ? 2.5 : 1.5;

  const boxH = nodeBoxHeight(node);
  const maxTextW = BOX_WIDTH - PADDING * 2;

  const toggleX = x + BOX_WIDTH + 10;
  const toggleY = y + boxH / 2;

  if (isCouple) {
    const fLines = wrapText(father.name, maxTextW);
    const mLines = wrapText(mother.name, maxTextW);
    // slot heights proportional to line count, sum = boxH
    const fSlotH = boxH * (fLines.length / (fLines.length + mLines.length));
    const mSlotH = boxH - fSlotH;
    const dividerY = y + fSlotH;

    return (
      <g>
        <g data-box onClick={(e) => { e.stopPropagation(); onClick(node.id); }} style={{ cursor: "pointer" }}>
          <rect x={x} y={y} width={BOX_WIDTH} height={boxH}
            fill="white" stroke={borderColor} strokeWidth={borderWidth} rx={2} />

          {fatherHighlight && (
            <rect x={x + 1} y={y + 1} width={BOX_WIDTH - 2} height={fSlotH - 1}
              fill={branchColor + "33"} rx={1} />
          )}
          {motherHighlight && (
            <rect x={x + 1} y={dividerY} width={BOX_WIDTH - 2} height={mSlotH - 1}
              fill={branchColor + "33"} rx={1} />
          )}

          <line x1={x} y1={dividerY} x2={x + BOX_WIDTH} y2={dividerY}
            stroke="#cccccc" strokeWidth={0.8} />

          <defs>
            <clipPath id={`clip-${node.id}-f`}>
              <rect x={x} y={y} width={BOX_WIDTH} height={fSlotH} />
            </clipPath>
            <clipPath id={`clip-${node.id}-m`}>
              <rect x={x} y={dividerY} width={BOX_WIDTH} height={mSlotH} />
            </clipPath>
          </defs>

          {renderLines(fLines, x, y, fSlotH, fatherHighlight, fatherHighlight, `clip-${node.id}-f`)}
          {renderLines(mLines, x, dividerY, mSlotH, motherHighlight, motherHighlight, `clip-${node.id}-m`)}
        </g>

        {hasChildren && (
          <g onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }} style={{ cursor: "pointer" }}>
            <circle cx={toggleX} cy={toggleY} r={TOGGLE_R}
              fill="white" stroke={branchColor} strokeWidth={1.5} />
            <text x={toggleX} y={toggleY + FONT_SIZE / 2 - 1}
              fontSize={FONT_SIZE} fontFamily={FONT_FAMILY}
              textAnchor="middle" fill={branchColor} fontWeight="bold"
              style={{ userSelect: "none" }}>
              {collapsed ? "+" : "−"}
            </text>
          </g>
        )}
      </g>
    );
  }

  // Single person
  const name = hasFather ? father.name : mother.name;
  const highlight = hasFather ? fatherHighlight : motherHighlight;
  const lines = wrapText(name, maxTextW);

  return (
    <g>
      <g data-box onClick={(e) => { e.stopPropagation(); onClick(node.id); }} style={{ cursor: "pointer" }}>
        <rect x={x} y={y} width={BOX_WIDTH} height={boxH}
          fill="white" stroke={borderColor} strokeWidth={borderWidth} rx={2} />

        {highlight && (
          <rect x={x + 1} y={y + 1} width={BOX_WIDTH - 2} height={boxH - 2}
            fill={branchColor + "33"} rx={1} />
        )}

        <defs>
          <clipPath id={`clip-${node.id}-s`}>
            <rect x={x} y={y} width={BOX_WIDTH} height={boxH} />
          </clipPath>
        </defs>

        {renderLines(lines, x, y, boxH, highlight, highlight, `clip-${node.id}-s`)}
      </g>

      {hasChildren && (
        <g onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }} style={{ cursor: "pointer" }}>
          <circle cx={toggleX} cy={toggleY} r={TOGGLE_R}
            fill="white" stroke={branchColor} strokeWidth={1.5} />
          <text x={toggleX} y={toggleY + FONT_SIZE / 2 - 1}
            fontSize={FONT_SIZE} fontFamily={FONT_FAMILY}
            textAnchor="middle" fill={branchColor} fontWeight="bold"
            style={{ userSelect: "none" }}>
            {collapsed ? "+" : "−"}
          </text>
        </g>
      )}
    </g>
  );
};
