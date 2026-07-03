import { categories, flowCatalog } from "./data.js?v=20260703-1";

let flow;
let dirty = false;
let autosaveTimer;
let loadedFlowId;
const $ = selector => document.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const nodeTypes = { start: "Start", action: "Actie", decision: "Vraag", note: "Opmerking", end: "Uitkomst" };
const customCategoryKey = "lohc-custom-categories";
const validTechnicalId = value => /^[a-z0-9-]+$/.test(value);

function customCategories() {
  try { return JSON.parse(localStorage.getItem(customCategoryKey)) || []; } catch { return []; }
}
function editorCategories() {
  const merged = new Map(customCategories().map(category => [category.id, category]));
  categories.forEach(category => merged.set(category.id, category));
  return [...merged.values()];
}

function emptyFlow() {
  const startId = generateInternalId("node");
  const endId = generateInternalId("node");
  return {
    $schema: "./flow.schema.json", schemaVersion: 1, id: "nieuwe-flow", category: "ledenadministratie", status: "draft", entry: startId,
    owner: { nl: "", en: "" }, reviewed: new Date().toISOString().slice(0, 10),
    nl: { title: "Nieuwe flow", description: "" }, en: { title: "New flow", description: "" }, contacts: [],
    nodes: [{ id: startId, type: "start", nl: { title: "Start" }, en: { title: "Start" }, next: endId }, { id: endId, type: "end", nl: { title: "Proces afgerond" }, en: { title: "Process completed" } }]
  };
}

async function initialize() {
  const flowId = new URLSearchParams(location.search).get("flow");
  const saved = flowId && localStorage.getItem(`lohc-flow-draft:${flowId}`);
  if (saved) flow = JSON.parse(saved);
  else if (flowId) {
    const item = flowCatalog.find(entry => entry.id === flowId);
    flow = item ? await fetch(item.file).then(response => response.json()) : emptyFlow();
  } else flow = emptyFlow();
  loadedFlowId = flow.id;
  render();
}

function localDraftList() {
  const drafts = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith("lohc-flow-draft:")) continue;
    try {
      const draft = JSON.parse(localStorage.getItem(key));
      if (draft?.id && draft?.nl?.title) drafts.push(draft);
    } catch { /* Ignore an invalid browser draft. */ }
  }
  return drafts;
}

function editorFlowList() {
  const entries = new Map(flowCatalog.map(item => [item.id, { id: item.id, title: item.nl.title, category: item.category, local: false }]));
  for (const draft of localDraftList()) {
    const publishedMatch = [...entries.values()].find(item => item.category === draft.category && item.title.trim().toLocaleLowerCase("nl") === draft.nl.title.trim().toLocaleLowerCase("nl"));
    if (publishedMatch && publishedMatch.id !== draft.id) entries.delete(publishedMatch.id);
    entries.set(draft.id, { id: draft.id, title: draft.nl.title, category: draft.category, local: true });
  }
  return [...entries.values()].sort((a, b) => a.title.localeCompare(b.title, "nl"));
}

function renderFlowSelector() {
  const selector = $("#flow-selector");
  const entries = editorFlowList();
  if (!entries.some(item => item.id === flow.id)) entries.push({ id: flow.id, title: flow.nl.title, local: true });
  selector.innerHTML = entries.map(item => `<option value="${escapeHtml(item.id)}"${item.id === flow.id ? " selected" : ""}>${escapeHtml(item.title)}${item.local ? " · lokaal" : ""}</option>`).join("");
}

async function openFlow(flowId) {
  if (dirty) saveLocalDraft(true);
  const saved = localStorage.getItem(`lohc-flow-draft:${flowId}`);
  if (saved) flow = JSON.parse(saved);
  else {
    const item = flowCatalog.find(entry => entry.id === flowId);
    if (!item) return showToast("Deze flow kon niet worden geopend");
    flow = await fetch(item.file).then(response => response.json());
  }
  loadedFlowId = flow.id;
  dirty = false;
  history.replaceState(null, "", `editor.html?flow=${encodeURIComponent(flow.id)}`);
  render();
  $("#save-state").textContent = saved ? "Concept lokaal bewaard" : "Gepubliceerde versie";
}

function setDirty(value = true) {
  dirty = value;
  $("#save-state").textContent = dirty ? "Wijzigingen opslaan…" : "Concept lokaal bewaard";
  $("#save-state").classList.toggle("is-saved", !dirty);
  if (dirty) {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveLocalDraft(true), 350);
  }
}

function saveLocalDraft(silent = false) {
  if (loadedFlowId && loadedFlowId !== flow.id) localStorage.removeItem(`lohc-flow-draft:${loadedFlowId}`);
  localStorage.setItem(`lohc-flow-draft:${flow.id}`, JSON.stringify(flow));
  loadedFlowId = flow.id;
  dirty = false;
  $("#save-state").textContent = "Concept lokaal bewaard";
  $("#save-state").classList.add("is-saved");
  renderFlowSelector();
  if (!silent) showToast("Concept lokaal bewaard en beschikbaar in de proceswijzer");
}

function options(selected, includeNone = true) {
  return `${includeNone ? `<option value="">— einde / niet ingesteld —</option>` : ""}${flow.nodes.map(node => `<option value="${escapeHtml(node.id)}"${node.id === selected ? " selected" : ""}>${escapeHtml(node.nl.title || "Naamloze stap")}</option>`).join("")}`;
}

function renderDetails() {
  $("#flow-details").innerHTML = `<div class="editor-card-heading"><div><p class="section-kicker">Algemeen</p><h2>Flowgegevens</h2></div></div>
    <div class="form-grid">
      <div class="field"><label>Technisch ID</label><input data-root="id" value="${escapeHtml(flow.id)}" aria-describedby="flow-id-hint"><small class="field-hint" id="flow-id-hint">Alleen kleine letters, cijfers en koppeltekens; bijvoorbeeld <code>nieuwe-inschrijving</code>.</small></div>
      <div class="field"><label>Categorie</label><div class="category-picker"><select data-root="category">${editorCategories().map(category => `<option value="${category.id}"${category.id === flow.category ? " selected" : ""}>${escapeHtml(category.nl.title)}</option>`).join("")}</select><button class="button button--quiet" id="add-category" type="button">+ Nieuwe categorie</button></div></div>
      <div class="field"><label>Titel Nederlands</label><input data-meta="nl.title" value="${escapeHtml(flow.nl.title)}"></div>
      <div class="field"><label>Titel Engels</label><input data-meta="en.title" value="${escapeHtml(flow.en.title)}"></div>
      <div class="field field--wide"><label>Omschrijving Nederlands</label><textarea data-meta="nl.description">${escapeHtml(flow.nl.description)}</textarea></div>
      <div class="field field--wide"><label>Omschrijving Engels</label><textarea data-meta="en.description">${escapeHtml(flow.en.description)}</textarea></div>
      <div class="field"><label>Proceseigenaar Nederlands</label><input data-owner="nl" value="${escapeHtml(flow.owner.nl)}"></div>
      <div class="field"><label>Proceseigenaar Engels</label><input data-owner="en" value="${escapeHtml(flow.owner.en)}"></div>
      <div class="field"><label>Laatst gecontroleerd</label><input type="date" data-root="reviewed" value="${escapeHtml(flow.reviewed)}"></div>
      <div class="field"><label>Startstap</label><select data-root="entry">${options(flow.entry, false)}</select></div>
    </div>`;
}

function renderNodes() {
  const insertionSelect = $("#insert-after");
  const previousInsertion = insertionSelect.value;
  insertionSelect.innerHTML = `<option value="">Kies waar de nieuwe stap moet komen…</option><option value="__loose">Los toevoegen (later koppelen)</option>${flow.nodes.filter(node => !["decision", "end"].includes(node.type)).map(node => `<option value="${escapeHtml(node.id)}">Invoegen na: ${escapeHtml(node.nl.title)}</option>`).join("")}`;
  if ([...insertionSelect.options].some(option => option.value === previousInsertion)) insertionSelect.value = previousInsertion;
  $("#node-list").innerHTML = flow.nodes.map(node => `<article class="node-editor" data-type="${node.type}" data-node-card="${escapeHtml(node.id)}">
    <header class="node-editor-header"><span class="node-type">${nodeTypes[node.type]}</span><strong>${escapeHtml(node.nl.title)}</strong>${node.id !== flow.entry ? `<button class="delete-node" type="button" data-delete-node="${escapeHtml(node.id)}">Verwijder</button>` : ""}</header>
    <div class="node-editor-body"><div class="form-grid">
      <div class="field field--wide"><label>Type</label><select data-node-field="type" data-node="${escapeHtml(node.id)}">${Object.entries(nodeTypes).map(([value, label]) => `<option value="${value}"${node.type === value ? " selected" : ""}>${label}</option>`).join("")}</select></div>
      <div class="field"><label>Titel Nederlands</label><input data-node-text="nl.title" data-node="${escapeHtml(node.id)}" value="${escapeHtml(node.nl.title)}"></div>
      <div class="field"><label>Titel Engels</label><input data-node-text="en.title" data-node="${escapeHtml(node.id)}" value="${escapeHtml(node.en.title)}"></div>
      <div class="field"><label>Detail Nederlands</label><input data-node-text="nl.detail" data-node="${escapeHtml(node.id)}" value="${escapeHtml(node.nl.detail || "")}"></div>
      <div class="field"><label>Detail Engels</label><input data-node-text="en.detail" data-node="${escapeHtml(node.id)}" value="${escapeHtml(node.en.detail || "")}"></div>
    </div>
    ${node.type === "decision" ? `<div class="routes-editor">${(node.routes || []).map((route, index) => `<div class="route-editor">
      <div class="field"><label>Label NL / EN</label><div class="route-label-pair"><input data-route-field="nl" data-node="${escapeHtml(node.id)}" data-route-index="${index}" value="${escapeHtml(route.nl)}"><input data-route-field="en" data-node="${escapeHtml(node.id)}" data-route-index="${index}" value="${escapeHtml(route.en)}"></div></div>
      <div class="field"><label>Ga naar</label><select data-route-field="target" data-node="${escapeHtml(node.id)}" data-route-index="${index}">${options(route.target)}</select></div>
      <button type="button" data-delete-route="${index}" data-node="${escapeHtml(node.id)}" aria-label="Route verwijderen">×</button>
    </div>`).join("")}</div><button class="add-route" type="button" data-add-route="${escapeHtml(node.id)}">+ Route toevoegen</button>` : node.type !== "end" ? `<div class="field" style="margin-top:.7rem"><label>Volgende stap</label><select data-node-field="next" data-node="${escapeHtml(node.id)}">${options(node.next || "")}</select></div>` : ""}
    </div></article>`).join("");
}

function renderContacts() {
  $("#contacts-editor").innerHTML = `<div class="editor-card-heading"><div><p class="section-kicker">Adresboek</p><h2>Contactpersonen</h2></div><button class="button button--quiet" id="add-contact" type="button">+ Contact</button></div>
    <div id="contact-rows">${flow.contacts.map((contact, index) => `<div class="contact-editor-row"><div class="field"><label>Rol Nederlands</label><input data-contact="nl" data-contact-index="${index}" value="${escapeHtml(contact.nl)}"></div><div class="field"><label>Rol Engels</label><input data-contact="en" data-contact-index="${index}" value="${escapeHtml(contact.en)}"></div><div class="field"><label>E-mailadres</label><input type="email" data-contact="email" data-contact-index="${index}" value="${escapeHtml(contact.email)}"></div><button class="delete-contact" type="button" data-delete-contact="${index}">Verwijder</button></div>`).join("")}</div>`;
}

function renderDangerZone() {
  const published = flowCatalog.some(item => item.id === flow.id);
  const hasLocalDraft = Boolean(localStorage.getItem(`lohc-flow-draft:${flow.id}`));
  let copy = "Deze flow bestaat alleen in deze browser. Verwijderen kan niet ongedaan worden gemaakt.";
  let button = `<button class="button button--danger" id="delete-flow" type="button">Verwijder flow</button>`;
  if (published && hasLocalDraft) {
    copy = "Verwijder alleen het lokale concept en herstel de gepubliceerde versie uit GitHub.";
    button = `<button class="button button--danger" id="delete-flow" type="button">Verwijder lokaal concept</button>`;
  } else if (published) {
    copy = "Dit is een gepubliceerde GitHub-flow. Verwijder het JSON-bestand en de catalogusvermelding in GitHub om deze voor iedereen te verwijderen.";
    button = "";
  }
  $("#danger-zone").innerHTML = `<div class="danger-zone-content"><div><p class="section-kicker">Gevarenzone</p><h2>Flow verwijderen</h2><p>${copy}</p></div>${button}</div>`;
}

function validate() {
  const errors = [];
  const ids = new Set();
  if (!validTechnicalId(flow.id)) errors.push("Het technische flow-ID mag alleen kleine letters, cijfers en koppeltekens bevatten. Gebruik geen spaties of hoofdletters.");
  for (const node of flow.nodes) {
    if (!/^[a-z0-9-]+$/.test(node.id)) errors.push(`“${node.nl?.title || "Naamloze stap"}” heeft intern een ongeldig kenmerk.`);
    if (ids.has(node.id)) errors.push(`“${node.nl?.title || "Naamloze stap"}” heeft intern een dubbel kenmerk.`);
    ids.add(node.id);
    if (!node.nl?.title || !node.en?.title) errors.push(`Een stap mist een Nederlandse of Engelse titel.`);
    if (node.type === "decision" && (!node.routes || node.routes.length < 2)) errors.push(`“${node.nl.title}” heeft minimaal twee routes nodig.`);
  }
  if (!ids.has(flow.entry)) errors.push(`De startstap “${flow.entry}” bestaat niet.`);
  for (const node of flow.nodes) {
    if (node.type !== "decision" && node.type !== "end" && !node.next) errors.push(`“${node.nl.title}”: kies een volgende stap of maak hiervan een uitkomst.`);
    if (node.next && !ids.has(node.next)) errors.push(`“${node.nl.title}” verwijst naar een ontbrekende vervolgstap.`);
    for (const route of node.routes || []) if (!route.target || !ids.has(route.target)) errors.push(`“${node.nl.title}” / “${route.nl}”: kies een geldige doelstap.`);
  }
  const reachable = new Set();
  function walk(id) { if (!id || reachable.has(id) || !ids.has(id)) return; reachable.add(id); const node = flow.nodes.find(item => item.id === id); if (node.next) walk(node.next); for (const route of node.routes || []) walk(route.target); }
  walk(flow.entry);
  for (const id of ids) if (!reachable.has(id)) errors.push(`“${nodeById(id)?.nl.title || "Naamloze stap"}” is nog niet gekoppeld aan de flow.`);
  return errors;
}

function editorNodeMap() { return new Map(flow.nodes.map(node => [node.id, node])); }
function editorDistances(startId, nodes) {
  const distances = new Map(); const queue = [[startId, 0]];
  while (queue.length) { const [id, distance] = queue.shift(); if (!id || distances.has(id)) continue; distances.set(id, distance); const node = nodes.get(id); if (!node) continue; if (node.next) queue.push([node.next, distance + 1]); for (const route of node.routes || []) queue.push([route.target, distance + 1]); }
  return distances;
}
function editorMerge(routes, nodes) {
  if (routes.length < 2) return null; const maps = routes.map(route => editorDistances(route.target, nodes));
  const candidates = [...maps[0].keys()].filter(id => maps.every(map => map.has(id)));
  candidates.sort((a, b) => maps.reduce((sum, map) => sum + map.get(a), 0) - maps.reduce((sum, map) => sum + map.get(b), 0));
  return candidates[0] || null;
}
function miniPath(id, path = new Set(), stopAt = null) {
  if (id === stopAt) return `<div class="mini-reference">↓ gaat hierna samen verder</div>`;
  const node = flow.nodes.find(item => item.id === id);
  if (!node) return `<div class="mini-reference">Ontbreekt: ${escapeHtml(id)}</div>`;
  if (path.has(id)) return `<div class="mini-reference">↪ ${escapeHtml(node.nl.title)}</div>`;
  const nextPath = new Set(path).add(id);
  const card = `<div class="mini-node mini-node--${node.type}">${escapeHtml(node.nl.title || node.id)}</div>`;
  if (node.type === "decision") { const routes = node.routes || []; const merge = editorMerge(routes, editorNodeMap()); return `${card}<div class="mini-branches">${routes.map(route => `<div class="mini-route"><div class="mini-route-label">${escapeHtml(route.nl || "Route")}</div>${miniPath(route.target, nextPath, merge)}</div>`).join("")}</div>${merge ? `<div class="mini-arrow">↓</div>${miniPath(merge, nextPath, stopAt)}` : ""}`; }
  return `${card}${node.next ? `<div class="mini-arrow">↓</div>${miniPath(node.next, nextPath, stopAt)}` : ""}`;
}

function updatePreviewAndValidation() {
  const errors = validate();
  const flowIdInput = document.querySelector('[data-root="id"]');
  if (flowIdInput) flowIdInput.setAttribute("aria-invalid", String(!validTechnicalId(flow.id)));
  $("#validation-count").textContent = errors.length;
  $("#validation-results").innerHTML = errors.length ? `<ul class="validation-list">${errors.map(error => `<li>${escapeHtml(error)}</li>`).join("")}</ul>` : `<div class="validation-ok">✓ Flow is compleet en verbonden.</div>`;
  const reachable = new Set();
  function walk(id) { if (!id || reachable.has(id)) return; const node = nodeById(id); if (!node) return; reachable.add(id); if (node.next) walk(node.next); for (const route of node.routes || []) walk(route.target); }
  walk(flow.entry);
  const looseNodes = flow.nodes.filter(node => !reachable.has(node.id));
  $("#flow-preview").innerHTML = `${miniPath(flow.entry)}${looseNodes.length ? `<section class="mini-unconnected"><h3>Losse, nog niet gekoppelde stappen</h3><div class="mini-unconnected-list">${looseNodes.map(node => `<div class="mini-unconnected-item">${escapeHtml(node.nl.title)}</div>`).join("")}</div></section>` : ""}`;
  $("#view-flow").href = `index.html#/flow/${encodeURIComponent(flow.id)}`;
}

function render() { renderFlowSelector(); renderDetails(); renderNodes(); renderContacts(); renderDangerZone(); bindEvents(); updatePreviewAndValidation(); }

function nestedSet(target, path, value) { const [locale, field] = path.split("."); target[locale] ||= {}; target[locale][field] = value; }
function nodeById(id) { return flow.nodes.find(node => node.id === id); }

function refreshNodeLabels(nodeId) {
  const node = nodeById(nodeId);
  if (!node) return;
  const heading = document.querySelector(`[data-node-card="${nodeId}"] .node-editor-header strong`);
  if (heading) heading.textContent = node.nl.title || "Naamloze stap";
  document.querySelectorAll("select option").forEach(option => {
    if (option.value !== nodeId) return;
    option.textContent = option.closest("#insert-after") ? `Invoegen na: ${node.nl.title || "Naamloze stap"}` : (node.nl.title || "Naamloze stap");
  });
}

function bindEvents() {
  $("#flow-selector").onchange = event => openFlow(event.currentTarget.value);
  document.querySelectorAll(".editor-shell input, .editor-shell select, .editor-shell textarea").forEach(input => input.addEventListener("input", event => {
    const element = event.currentTarget;
    if (element.dataset.root) flow[element.dataset.root] = element.value;
    if (element.dataset.meta) nestedSet(flow, element.dataset.meta, element.value);
    if (element.dataset.owner) flow.owner[element.dataset.owner] = element.value;
    if (element.dataset.nodeText) {
      nestedSet(nodeById(element.dataset.node), element.dataset.nodeText, element.value);
      if (element.dataset.nodeText === "nl.title") refreshNodeLabels(element.dataset.node);
    }
    if (element.dataset.nodeField && element.dataset.nodeField !== "id") nodeById(element.dataset.node)[element.dataset.nodeField] = element.value;
    if (element.dataset.routeField) nodeById(element.dataset.node).routes[Number(element.dataset.routeIndex)][element.dataset.routeField] = element.value;
    if (element.dataset.contact) flow.contacts[Number(element.dataset.contactIndex)][element.dataset.contact] = element.value;
    setDirty(); updatePreviewAndValidation();
  }));
  document.querySelectorAll("[data-node-field='type']").forEach(select => select.addEventListener("change", event => {
    const node = nodeById(event.currentTarget.dataset.node); node.type = event.currentTarget.value;
    if (node.type === "decision") { delete node.next; node.routes ||= [{ id: "yes", nl: "Ja", en: "Yes", target: "" }, { id: "no", nl: "Nee", en: "No", target: "" }]; }
    else { delete node.routes; if (node.type === "end") delete node.next; }
    setDirty(); render();
  }));
  document.querySelectorAll("[data-add-node]").forEach(button => { button.onclick = () => addNode(button.dataset.addNode); });
  document.querySelectorAll("[data-delete-node]").forEach(button => button.addEventListener("click", () => deleteNode(button.dataset.deleteNode)));
  document.querySelectorAll("[data-add-route]").forEach(button => button.addEventListener("click", () => { nodeById(button.dataset.addRoute).routes.push({ id: generateInternalId("route"), nl: "Route", en: "Route", target: "" }); setDirty(); render(); }));
  document.querySelectorAll("[data-delete-route]").forEach(button => button.addEventListener("click", () => { nodeById(button.dataset.node).routes.splice(Number(button.dataset.deleteRoute), 1); setDirty(); render(); }));
  document.querySelectorAll("[data-delete-contact]").forEach(button => button.addEventListener("click", () => { flow.contacts.splice(Number(button.dataset.deleteContact), 1); setDirty(); render(); }));
  $("#add-contact").addEventListener("click", () => { flow.contacts.push({ nl: "Nieuwe contactrol", en: "New contact role", email: "" }); setDirty(); render(); });
  $("#add-category").addEventListener("click", addCategory);
  $("#delete-flow")?.addEventListener("click", deleteCurrentFlow);
}

function addCategory() {
  const nlTitle = prompt("Naam van de nieuwe categorie (Nederlands):")?.trim();
  if (!nlTitle) return;
  const enTitle = prompt("Naam van de categorie in het Engels (optioneel):", nlTitle)?.trim() || nlTitle;
  if (!confirm(`Categorie “${nlTitle}” aanmaken?`)) return;
  const baseId = nlTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "categorie";
  const usedIds = new Set(editorCategories().map(category => category.id));
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
  const category = {
    id, icon: "◇",
    nl: { title: nlTitle, description: "Eigen categorie." },
    en: { title: enTitle, description: "Custom category." }
  };
  localStorage.setItem(customCategoryKey, JSON.stringify([...customCategories(), category]));
  flow.category = id;
  setDirty();
  render();
  showToast(`Categorie “${nlTitle}” aangemaakt en geselecteerd`);
}

async function deleteCurrentFlow() {
  const published = flowCatalog.some(item => item.id === flow.id);
  const confirmation = prompt(`Je staat op het punt “${flow.nl.title}” ${published ? "als lokaal concept " : ""}te verwijderen. Typ delete om te bevestigen.`);
  if (confirmation?.trim().toLowerCase() !== "delete") return showToast("Verwijderen geannuleerd");
  clearTimeout(autosaveTimer);
  const deletedId = flow.id;
  localStorage.removeItem(`lohc-flow-draft:${deletedId}`);
  sessionStorage.removeItem(`lohc-flow-answers:${deletedId}`);
  dirty = false;
  loadedFlowId = null;
  if (published) {
    await openFlow(deletedId);
    showToast("Lokaal concept verwijderd; gepubliceerde versie hersteld");
    return;
  }
  const next = editorFlowList()[0];
  if (next) await openFlow(next.id);
  else { flow = emptyFlow(); loadedFlowId = flow.id; history.replaceState(null, "", "editor.html"); render(); }
  showToast("Flow verwijderd");
}

function generateInternalId(prefix) {
  const random = globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}
function addNode(type) {
  const insertionChoice = $("#insert-after").value;
  if (!insertionChoice) { showToast("Kies eerst waar de nieuwe stap moet komen"); return; }
  const id = generateInternalId("node"); const labels = { action: ["Nieuwe actie", "New action"], decision: ["Nieuwe vraag?", "New question?"], note: ["Nieuwe opmerking", "New note"], end: ["Proces afgerond", "Process completed"] };
  const node = { id, type, nl: { title: labels[type][0] }, en: { title: labels[type][1] } };
  if (type === "decision") node.routes = [{ id: generateInternalId("route"), nl: "Ja", en: "Yes", target: "" }, { id: generateInternalId("route"), nl: "Nee", en: "No", target: "" }];
  else if (type !== "end") node.next = "";
  const insertAfter = insertionChoice === "__loose" ? "" : insertionChoice;
  if (insertAfter) {
    const source = nodeById(insertAfter);
    if (type !== "end") node.next = source.next || "";
    source.next = id;
  }
  flow.nodes.push(node); setDirty(); render();
  showToast(insertAfter ? `${labels[type][0]} ingevoegd en gekoppeld` : `${labels[type][0]} toegevoegd als losse stap`);
  document.querySelector(`[data-node-card="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}
function deleteNode(id) {
  if (!confirm(`Stap “${id}” verwijderen? Verwijzingen naar deze stap worden leeggemaakt.`)) return;
  flow.nodes = flow.nodes.filter(node => node.id !== id);
  for (const node of flow.nodes) { if (node.next === id) node.next = ""; for (const route of node.routes || []) if (route.target === id) route.target = ""; }
  setDirty(); render();
}

function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("is-visible"); setTimeout(() => toast.classList.remove("is-visible"), 1800); }
$("#save-draft").addEventListener("click", () => saveLocalDraft(false));
$("#download-flow").addEventListener("click", () => {
  if (!validTechnicalId(flow.id)) {
    document.querySelector('[data-root="id"]')?.focus();
    showToast("Corrigeer eerst het technische ID: geen spaties of hoofdletters");
    return;
  }
  const blob = new Blob([`${JSON.stringify(flow, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${flow.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("JSON gedownload");
});
$("#new-flow").addEventListener("click", () => { if (dirty) saveLocalDraft(true); flow = emptyFlow(); loadedFlowId = null; history.replaceState(null, "", "editor.html"); setDirty(); render(); });
$("#import-flow").addEventListener("change", async event => { try { flow = JSON.parse(await event.target.files[0].text()); setDirty(); render(); showToast("Flow geïmporteerd"); } catch { showToast("Dit is geen geldige JSON-flow"); } event.target.value = ""; });
window.addEventListener("beforeunload", event => { if (!dirty) return; event.preventDefault(); event.returnValue = ""; });

initialize().catch(error => { console.error(error); flow = emptyFlow(); render(); showToast("Flow kon niet worden geladen; een nieuwe flow is geopend."); });
