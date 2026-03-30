import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, "data");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

/**
 * Find the folder for a given node id by searching recursively under DATA_DIR.
 * Each couple lives in a folder containing index.json with that id.
 */
function findNodeDir(id, searchDir = DATA_DIR) {
  // Check if this dir has an index.json matching the id
  const indexPath = path.join(searchDir, "index.json");
  if (fs.existsSync(indexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      if (data.id === id) return searchDir;
    } catch {}
  }

  // Also check root.json at DATA_DIR level
  if (searchDir === DATA_DIR) {
    const rootPath = path.join(DATA_DIR, "root.json");
    if (fs.existsSync(rootPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(rootPath, "utf-8"));
        if (data.id === id) return DATA_DIR;
      } catch {}
    }
  }

  // Recurse into subdirectories
  if (!fs.existsSync(searchDir)) return null;
  for (const entry of fs.readdirSync(searchDir)) {
    const full = path.join(searchDir, entry);
    if (fs.statSync(full).isDirectory()) {
      const found = findNodeDir(id, full);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Load a node by id and recursively load its children.
 */
function loadNode(id, searchDir = DATA_DIR) {
  const nodeDir = findNodeDir(id, searchDir);
  if (!nodeDir) return null;

  const isRoot = nodeDir === DATA_DIR;
  const filePath = isRoot
    ? path.join(DATA_DIR, "root.json")
    : path.join(nodeDir, "index.json");

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }

  // children is array of id strings — resolve each recursively
  const children = (data.children || [])
    .map((childId) => loadNode(childId, DATA_DIR))
    .filter(Boolean);

  return { ...data, children };
}

/**
 * Derive a folder name from a couple's names, e.g. "nassif-gheta".
 * Falls back to the node id if both names are empty.
 */
function coupleFolderName(node) {
  const slug = (s) =>
    s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const f = slug(node.father?.name || "");
  const m = slug(node.mother?.name || "");
  if (f && m) return `${f}_${m}`;
  if (f) return f;
  if (m) return m;
  return node.id;
}

/**
 * Save a node recursively — each couple lives in <parentDir>/<couple-name>/index.json.
 * Children are nested inside their parent's folder.
 * The id inside index.json is the source of truth, not the folder name.
 */
function saveNode(node, parentDir = DATA_DIR) {
  const isRoot = node.id === "root";
  const nodeDir = isRoot ? DATA_DIR : path.join(parentDir, coupleFolderName(node));

  if (!isRoot) fs.mkdirSync(nodeDir, { recursive: true });

  const filePath = isRoot
    ? path.join(DATA_DIR, "root.json")
    : path.join(nodeDir, "index.json");

  const childIds = node.children.map((c) => c.id);
  fs.writeFileSync(filePath, JSON.stringify({ ...node, children: childIds }, null, 2));

  for (const child of node.children) {
    saveNode(child, nodeDir);
  }
}

app.get("/api/tree", (req, res) => {
  const tree = loadNode("root");
  if (!tree) return res.status(500).json({ error: "Could not load tree" });
  res.json(tree);
});

app.post("/api/tree", (req, res) => {
  const tree = req.body;
  if (!tree || typeof tree !== "object" || !tree.id) {
    return res.status(400).json({ error: "Invalid tree payload" });
  }
  try {
    saveNode(tree);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Family tree backend running at http://localhost:${PORT}`);
});
