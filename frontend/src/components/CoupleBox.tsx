import React from "react";
import { LayoutNode } from "../types";
import { BOX_WIDTH, BOX_HEIGHT } from "../lib/layoutTree";

interface Props {
  node: LayoutNode;
  selected: boolean;
  onClick: (id: string) => void;
}

const NAME_ROW_H = BOX_HEIGHT / 2;
const PADDING = 5;
const FONT_SIZE = 11;

export const CoupleBox: React.FC<Props> = ({ node, selected, onClick }) => {
  const { x, y, father, mother, descendantSide, branchColor } = node;

  const fatherHighlight =
    descendantSide === "father" || descendantSide === "both";
  const motherHighlight =
    descendantSide === "mother" || descendantSide === "both";

  const borderColor = selected ? "#1d4ed8" : branchColor;
  const borderWidth = selected ? 2.5 : 1.5;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onClick(node.id);
      }}
      style={{ cursor: "pointer" }}
    >
      {/* Outer box */}
      <rect
        x={x}
        y={y}
        width={BOX_WIDTH}
        height={BOX_HEIGHT}
        fill="white"
        stroke={borderColor}
        strokeWidth={borderWidth}
        rx={2}
      />

      {/* Divider between father and mother */}
      <line
        x1={x}
        y1={y + NAME_ROW_H}
        x2={x + BOX_WIDTH}
        y2={y + NAME_ROW_H}
        stroke="#cccccc"
        strokeWidth={0.8}
      />

      {/* Father highlight background */}
      {fatherHighlight && (
        <rect
          x={x + 1}
          y={y + 1}
          width={BOX_WIDTH - 2}
          height={NAME_ROW_H - 1}
          fill={branchColor + "33"}
          rx={1}
        />
      )}

      {/* Mother highlight background */}
      {motherHighlight && (
        <rect
          x={x + 1}
          y={y + NAME_ROW_H}
          width={BOX_WIDTH - 2}
          height={NAME_ROW_H - 1}
          fill={branchColor + "33"}
          rx={1}
        />
      )}

      {/* Father name */}
      <text
        x={x + PADDING}
        y={y + NAME_ROW_H / 2 + FONT_SIZE / 2 - 1}
        fontSize={FONT_SIZE}
        fontFamily="Arial, sans-serif"
        fill={fatherHighlight ? "#111" : "#333"}
        fontWeight={fatherHighlight ? "bold" : "normal"}
        clipPath={`url(#clip-${node.id}-f)`}
      >
        {father.name}
      </text>

      {/* Mother name */}
      <text
        x={x + PADDING}
        y={y + NAME_ROW_H + NAME_ROW_H / 2 + FONT_SIZE / 2 - 1}
        fontSize={FONT_SIZE}
        fontFamily="Arial, sans-serif"
        fill={motherHighlight ? "#111" : "#333"}
        fontWeight={motherHighlight ? "bold" : "normal"}
        clipPath={`url(#clip-${node.id}-m)`}
      >
        {mother.name}
      </text>

      {/* Clip paths to prevent text overflow */}
      <defs>
        <clipPath id={`clip-${node.id}-f`}>
          <rect x={x + PADDING} y={y} width={BOX_WIDTH - PADDING * 2} height={NAME_ROW_H} />
        </clipPath>
        <clipPath id={`clip-${node.id}-m`}>
          <rect x={x + PADDING} y={y + NAME_ROW_H} width={BOX_WIDTH - PADDING * 2} height={NAME_ROW_H} />
        </clipPath>
      </defs>
    </g>
  );
};
