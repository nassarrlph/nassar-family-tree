import { CoupleNode } from "../types";

const BASE = "/api";

export async function fetchTree(): Promise<CoupleNode> {
  const res = await fetch(`${BASE}/tree`);
  if (!res.ok) throw new Error("Failed to load tree");
  return res.json();
}

export async function saveTree(tree: CoupleNode): Promise<void> {
  const res = await fetch(`${BASE}/tree`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tree),
  });
  if (!res.ok) throw new Error("Failed to save tree");
}
