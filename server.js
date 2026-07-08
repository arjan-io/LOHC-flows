import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categories as bundledCategories, flowCatalog as bundledCatalog } from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 8080);
const dataDir = process.env.DATA_DIR || "/data";
const adminToken = process.env.LOHC_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";
const categoriesPath = path.join(dataDir, "categories.json");
const flowsDir = path.join(dataDir, "flows");
const seedMarkerPath = path.join(dataDir, ".seeded");
const publicDir = __dirname;
const idPattern = /^[a-z0-9-]+$/;

app.use(express.json({ limit: "4mb" }));

function requireAdmin(req, res, next) {
  if (!adminToken) return next();
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Beheerderscode nodig." });
  if (token !== adminToken) return res.status(403).json({ error: "Beheerderscode klopt niet." });
  next();
}

function isValidId(value) {
  return typeof value === "string" && idPattern.test(value);
}

function safeFlowPath(id) {
  if (!isValidId(id)) {
    const error = new Error("Invalid flow id");
    error.status = 400;
    throw error;
  }
  return path.join(flowsDir, `${id}.json`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`);
  await fs.rename(temporaryPath, filePath);
}

function catalogEntryFromFlow(flow) {
  return {
    id: flow.id,
    file: `/api/flows/${flow.id}`,
    category: flow.category,
    status: flow.status || "draft",
    nl: {
      title: flow.nl?.title || flow.id,
      description: flow.nl?.description || "",
      keywords: flow.nl?.keywords || []
    },
    en: {
      title: flow.en?.title || flow.nl?.title || flow.id,
      description: flow.en?.description || "",
      keywords: flow.en?.keywords || []
    }
  };
}

function normalizeCategoryIcons(categories) {
  const bundledById = new Map(bundledCategories.map(category => [category.id, category]));
  const used = new Set();
  let changed = false;
  const normalizedCategories = categories.map(category => {
    const nextCategory = { ...category };
    const bundled = bundledById.get(category.id);
    const icon = String(category.icon || "");
    if (bundled?.icon && (!icon || icon === "♙" || icon === "◇")) {
      nextCategory.icon = bundled.icon;
      changed = true;
    }
    if (!nextCategory.icon || used.has(String(nextCategory.icon).toUpperCase())) {
      nextCategory.icon = uniqueCategoryIcon(nextCategory.nl?.title || nextCategory.id, used);
      changed = true;
    }
    used.add(String(nextCategory.icon).toUpperCase());
    return nextCategory;
  });
  return { changed, categories: normalizedCategories };
}

function uniqueCategoryIcon(title, used) {
  const normalized = String(title).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = normalized.toUpperCase().match(/[A-Z0-9]+/g) || [];
  const compact = words.join("");
  const candidates = [];
  if (words.length >= 2) candidates.push(`${words[0][0]}${words[1][0]}`);
  if (words[0]?.length >= 2) candidates.push(words[0].slice(0, 2));
  for (let size = 2; size <= 3; size += 1) if (compact.length >= size) candidates.push(compact.slice(0, size));
  candidates.push("CT");
  for (const candidate of candidates) if (!used.has(candidate)) return candidate;
  let suffix = 2;
  while (used.has(`C${suffix}`)) suffix += 1;
  return `C${suffix}`;
}

async function seedDataStore() {
  await fs.mkdir(flowsDir, { recursive: true });
  if (!(await exists(categoriesPath))) await writeJson(categoriesPath, bundledCategories);
  else {
    const normalized = normalizeCategoryIcons(await readJson(categoriesPath));
    if (normalized.changed) await writeJson(categoriesPath, normalized.categories);
  }

  if (await exists(seedMarkerPath)) return;
  for (const item of bundledCatalog) {
    const targetPath = safeFlowPath(item.id);
    if (await exists(targetPath)) continue;
    const sourcePath = path.join(publicDir, item.file);
    await fs.copyFile(sourcePath, targetPath);
  }
  await fs.writeFile(seedMarkerPath, new Date().toISOString());
}

async function readCategories() {
  return readJson(categoriesPath);
}

async function readFlowList() {
  const entries = await fs.readdir(flowsDir, { withFileTypes: true });
  const flows = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    try {
      const flow = await readJson(path.join(flowsDir, entry.name));
      if (isValidId(flow.id)) flows.push(flow);
    } catch (error) {
      console.warn(`Skipping invalid flow ${entry.name}:`, error.message);
    }
  }
  return flows.sort((a, b) => (a.nl?.title || a.id).localeCompare(b.nl?.title || b.id, "nl"));
}

function validateCategory(category) {
  if (!isValidId(category?.id)) return "Categorie-ID mag alleen kleine letters, cijfers en koppeltekens bevatten.";
  if (!category?.nl?.title || !category?.en?.title) return "Categorie mist een Nederlandse of Engelse titel.";
  return "";
}

function validateFlow(flow) {
  if (!isValidId(flow?.id)) return "Flow-ID mag alleen kleine letters, cijfers en koppeltekens bevatten.";
  if (!isValidId(flow?.category)) return "Flow heeft een ongeldige categorie.";
  if (!flow?.nl?.title || !flow?.en?.title) return "Flow mist een Nederlandse of Engelse titel.";
  if (!Array.isArray(flow?.nodes) || !flow.nodes.length) return "Flow heeft minimaal één stap nodig.";
  const ids = new Set();
  for (const node of flow.nodes) {
    if (ids.has(node.id)) return `Stap-ID “${node.id}” komt dubbel voor.`;
    ids.add(node.id);
  }
  if (!ids.has(flow.entry)) return "Startstap bestaat niet.";
  for (const node of flow.nodes) {
    if (!isValidId(node.id)) return `Stap “${node.nl?.title || node.id || "naamloos"}” heeft een ongeldig ID.`;
    if (node.next && !ids.has(node.next)) return `Stap “${node.nl?.title || node.id}” verwijst naar een ontbrekende vervolgstap.`;
    for (const route of node.routes || []) {
      if (!route.target || !ids.has(route.target)) return `Route “${route.nl || route.id || "naamloos"}” verwijst naar een ontbrekende stap.`;
    }
  }
  return "";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/catalog", async (_req, res, next) => {
  try {
    const [categories, flows] = await Promise.all([readCategories(), readFlowList()]);
    res.json({ categories, flowCatalog: flows.map(catalogEntryFromFlow), serverBacked: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/flows/:id", async (req, res, next) => {
  try {
    res.json(await readJson(safeFlowPath(req.params.id)));
  } catch (error) {
    if (error.code === "ENOENT") error.status = 404;
    next(error);
  }
});

app.put("/api/flows/:id", requireAdmin, async (req, res, next) => {
  try {
    const flow = req.body;
    const validationError = validateFlow(flow);
    if (validationError) return res.status(400).json({ error: validationError });
    if (flow.id !== req.params.id) {
      const oldPath = safeFlowPath(req.params.id);
      if (await exists(oldPath)) await fs.rm(oldPath);
    }
    await writeJson(safeFlowPath(flow.id), flow);
    res.json({ ok: true, flow: catalogEntryFromFlow(flow) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/flows/:id", requireAdmin, async (req, res, next) => {
  try {
    await fs.rm(safeFlowPath(req.params.id), { force: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/categories", requireAdmin, async (req, res, next) => {
  try {
    const category = req.body;
    const validationError = validateCategory(category);
    if (validationError) return res.status(400).json({ error: validationError });
    const categories = await readCategories();
    const index = categories.findIndex(item => item.id === category.id);
    if (index >= 0) categories[index] = category;
    else categories.push(category);
    await writeJson(categoriesPath, categories);
    res.json({ ok: true, category });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(publicDir, {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
  }
}));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || "Server error" });
});

await seedDataStore();
app.listen(port, "0.0.0.0", () => console.log(`LOHC flows listening on ${port}`));
