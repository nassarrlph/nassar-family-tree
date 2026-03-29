import React from "react";
import { LayoutNode } from "../types";
import { BOX_WIDTH, BOX_HEIGHT } from "../lib/layoutTree";

interface Props {
  node: LayoutNode;
  selected: boolean;
  onClick: (id: string) => void;
}

const PADDING = 5;
const FONT_SIZE = 14;
const FONT_FAMILY = "'Times New Roman', Times, serif";
const ROW_H = BOX_HEIGHT / 2;

export const CoupleBox: React.FC<Props> = ({ node, selected, onClick }) => {
  const { x, y, father, mother, descendantSide, branchColor } = node;

  const hasFather = father.name.trim() !== "";
  const hasMother = mother.name.trim() !== "";
  const isCouple = hasFather && hasMother;

  const fatherHighlight = descendantSide === "father" || descendantSide === "both";
  const motherHighlight = descendantSide === "mother" || descendantSide === "both";

  const borderColor = selected ? "#1d4ed8" : branchColor;
  const borderWidth = selected ? 2.5 : 1.5;

  const singleName = hasFather ? father.name : mother.name;
  const singleHighlight = hasFather ? fatherHighlight : motherHighlight;

  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(node.id); }} style={{ cursor: "pointer" }}>
      {/* Box */}
      <rect x={x} y={y} width={BOX_WIDTH} height={BOX_HEIGHT}
        fill="white" stroke={borderColor} strokeWidth={borderWidth} rx={2} />

      {isCouple ? (
        <>
          {/* Divider */}
          <line x1={x} y1={y + ROW_H} x2={x + BOX_WIDTH} y2={y + ROW_H}
            stroke="#cccccc" strokeWidth={0.8} />

          {fatherHighlight && (
            <rect x={x + 1} y={y + 1} width={BOX_WIDTH - 2} height={ROW_H - 1}
              fill={branchColor + "33"} rx={1} />
          )}
          {motherHighlight && (
            <rect x={x + 1} y={y + ROW_H} width={BOX_WIDTH - 2} height={ROW_H - 1}
              fill={branchColor + "33"} rx={1} />
          )}

          <text x={x + PADDING} y={y + ROW_H / 2 + FONT_SIZE / 2 - 1}
            fontSize={FONT_SIZE} fontFamily={FONT_FAMILY}
            fill={fatherHighlight ? "#111" : "#333"}
            fontWeight={fatherHighlight ? "bold" : "normal"}
            clipPath={`url(#clip-${node.id}-f)`}>
            {father.name}
          </text>
          <text x={x + PADDING} y={y + ROW_H + ROW_H / 2 + FONT_SIZE / 2 - 1}
            fontSize={FONT_SIZE} fontFamily={FONT_FAMILY}
            fill={motherHighlight ? "#111" : "#333"}
            fontWeight={motherHighlight ? "bold" : "normal"}
            clipPath={`url(#clip-${node.id}-m)`}>
            {mother.name}
          </text>

          <defs>
            <clipPath id={`clip-${node.id}-f`}>
              <rect x={x + PADDING} y={y} width={BOX_WIDTH - PADDING * 2} height={ROW_H} />
            </clipPath>
            <clipPath id={`clip-${node.id}-m`}>
              <rect x={x + PADDING} y={y + ROW_H} width={BOX_WIDTH - PADDING * 2} height={ROW_H} />
            </clipPath>
          </defs>
        </>
      ) : (
        <>
          {singleHighlight && (
            <rect x={x + 1} y={y + 1} width={BOX_WIDTH - 2} height={BOX_HEIGHT - 2}
              fill={branchColor + "33"} rx={1} />
          )}
          <text x={x + PADDING} y={y + BOX_HEIGHT / 2 + FONT_SIZE / 2 - 1}
            fontSize={FONT_SIZE} fontFamily={FONT_FAMILY}
            fill={singleHighlight ? "#111" : "#333"}
            fontWeight={singleHighlight ? "bold" : "normal"}
            clipPath={`url(#clip-${node.id}-s)`}>
            {singleName}
          </text>
          <defs>
            <clipPath id={`clip-${node.id}-s`}>
              <rect x={x + PADDING} y={y} width={BOX_WIDTH - PADDING * 2} height={BOX_HEIGHT} />
            </clipPath>
          </defs>
        </>
      )}
    </g>
  );
};
