import { create } from "zustand";
import { CoupleNode, DescendantSide } from "./types";
import { cloneTree, findNode, removeNode, genId } from "./lib/treeUtils";
import { fetchTree, saveTree } from "./lib/api";

interface TreeStore {
  tree: CoupleNode | null;
  selectedId: string | null;
  saving: boolean;
  loading: boolean;
  error: string | null;

  loadTree: () => Promise<void>;
  persistTree: () => Promise<void>;
  selectNode: (id: string | null) => void;

  updateNode: (id: string, patch: Partial<Omit<CoupleNode, "id" | "children">>) => void;
  addChild: (parentId: string) => void;
  deleteNode: (id: string) => void;
}

export const useTreeStore = create<TreeStore>((set, get) => ({
  tree: null,
  selectedId: null,
  saving: false,
  loading: false,
  error: null,

  loadTree: async () => {
    set({ loading: true, error: null });
    try {
      const tree = await fetchTree();
      set({ tree, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  persistTree: async () => {
    const { tree } = get();
    if (!tree) return;
    set({ saving: true, error: null });
    try {
      await saveTree(tree);
      set({ saving: false });
    } catch (e) {
      set({ error: String(e), saving: false });
    }
  },

  selectNode: (id) => set({ selectedId: id }),

  updateNode: (id, patch) => {
    const { tree } = get();
    if (!tree) return;
    const clone = cloneTree(tree);
    const node = findNode(clone, id);
    if (!node) return;
    Object.assign(node, patch);
    set({ tree: clone });
  },

  addChild: (parentId) => {
    const { tree } = get();
    if (!tree) return;
    const clone = cloneTree(tree);
    const parent = findNode(clone, parentId);
    if (!parent) return;
    const newChild: CoupleNode = {
      id: genId(),
      father: { id: genId(), name: "New Father" },
      mother: { id: genId(), name: "New Mother" },
      descendantSide: "father",
      branchColor: parent.branchColor,
      children: [],
    };
    parent.children.push(newChild);
    set({ tree: clone, selectedId: newChild.id });
  },

  deleteNode: (id) => {
    const { tree } = get();
    if (!tree || tree.id === id) return; // can't delete root
    const clone = cloneTree(tree);
    removeNode(clone, id);
    set({ tree: clone, selectedId: null });
  },
}));
