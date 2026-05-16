import { CoupleNode } from "../types";

/** Deep clone a tree */
export function cloneTree(node: CoupleNode): CoupleNode {
  return JSON.parse(JSON.stringify(node));
}

/** Generate a simple unique id */
export function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Find a node by id (returns reference in cloned tree) */
export function findNode(root: CoupleNode, id: string): CoupleNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** Find parent of a node */
export function findParent(root: CoupleNode, id: string): CoupleNode | null {
  for (const child of root.children) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

/** Remove a node by id from the tree (mutates clone) */
export function removeNode(root: CoupleNode, id: string): boolean {
  for (let i = 0; i < root.children.length; i++) {
    if (root.children[i].id === id) {
      root.children.splice(i, 1);
      return true;
    }
    if (removeNode(root.children[i], id)) return true;
  }
  return false;
}

/** Collect all nodes as flat array */
export function flattenTree(root: CoupleNode): CoupleNode[] {
  const result: CoupleNode[] = [root];
  for (const child of root.children) {
    result.push(...flattenTree(child));
  }
  return result;
}
