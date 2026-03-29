export type DescendantSide = "father" | "mother" | "both" | "none";

export type PersonRef = {
  id: string;
  name: string;
};

export type CoupleNode = {
  id: string;
  father: PersonRef;
  mother: PersonRef;
  descendantSide: DescendantSide;
  branchColor: string;
  children: CoupleNode[];
  layout?: {
    xOffset?: number;
    yOffset?: number;
  };
};

export type LayoutNode = CoupleNode & {
  x: number;
  y: number;
  subtreeWidth: number;
};
