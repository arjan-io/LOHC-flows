import { categories, flowCatalog } from "./data.js?v=20260703-2";

const translations = {
  nl: {
    brandSubtitle: "Proceswijzer", help: "Hulp nodig?", footer: "LOHC Proceswijzer · Samen houden we de club draaiend",
    eyebrow: "Kennisbank voor de club", heroTitle: "Wat wil je <span>regelen?</span>",
    heroCopy: "Vind snel de juiste stappen, contactpersonen en afspraken voor iedere situatie binnen LOHC.",
    searchPlaceholder: "Zoek bijvoorbeeld ‘nieuw lid’, ‘VOG’ of ‘wedstrijd’…", categories: "Kies een categorie",
    categoriesCopy: "Bekijk alle processen per onderwerp", processes: n => `${n} ${n === 1 ? "proces" : "processen"}`,
    noProcesses: "Nog geen processen", results: n => `${n} ${n === 1 ? "resultaat" : "resultaten"}`,
    noResults: "Geen processen gevonden. Probeer een andere zoekterm.", home: "Home", draft: "Conceptproces",
    owner: "Proceseigenaar", reviewed: "Laatst gecontroleerd", category: "Categorie", contacts: "Contactpersonen",
    legend: "Legenda", start: "Begin", outcome: "Uitkomst", startEnd: "Begin / uitkomst", action: "Actie", decision: "Beslissing", note: "Opmerking",
    share: "Deel", print: "Print", edit: "Bewerk flow", copied: "Link gekopieerd", copyEmail: "Kopieer e-mailadres",
    emailCopied: "E-mailadres gekopieerd", loading: "Proces laden…", invalidFlow: "Deze flow kon niet worden geladen.",
    continuesAt: "Vervolg bij", guided: "Begeleid", overview: "Overzicht", chooseAnswer: "Kies een antwoord om verder te gaan",
    yourRoute: "Jouw route", previousQuestion: "Vorige vraag", startAgain: "Start opnieuw", localDraft: "Lokaal concept",
    usePublished: "Gebruik gepubliceerde versie"
  },
  en: {
    brandSubtitle: "Process guide", help: "Need help?", footer: "LOHC Process Guide · Together we keep the club running",
    eyebrow: "The club knowledge base", heroTitle: "What do you want to <span>arrange?</span>",
    heroCopy: "Quickly find the right steps, contacts and agreements for every situation within LOHC.",
    searchPlaceholder: "Try ‘new member’, ‘volunteer’ or ‘match’…", categories: "Choose a category",
    categoriesCopy: "Browse all processes by subject", processes: n => `${n} ${n === 1 ? "process" : "processes"}`,
    noProcesses: "No processes yet", results: n => `${n} ${n === 1 ? "result" : "results"}`,
    noResults: "No processes found. Try a different search term.", home: "Home", draft: "Draft process",
    owner: "Process owner", reviewed: "Last reviewed", category: "Category", contacts: "Contacts",
    legend: "Legend", start: "Start", outcome: "Outcome", startEnd: "Start / outcome", action: "Action", decision: "Decision", note: "Note",
    share: "Share", print: "Print", edit: "Edit flow", copied: "Link copied", copyEmail: "Copy email address",
    emailCopied: "Email address copied", loading: "Loading process…", invalidFlow: "This flow could not be loaded.",
    continuesAt: "Continues at", guided: "Guided", overview: "Overview", chooseAnswer: "Choose an answer to continue",
    yourRoute: "Your route", previousQuestion: "Previous question", startAgain: "Start again", localDraft: "Local draft",
    usePublished: "Use published version"
  }
};

let language = localStorage.getItem("lohc-language") || "nl";
const flowCache = new Map();
const main = document.querySelector("main");
const toggle = document.querySelector("#language-toggle");
const t = key => translations[language][key];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function updateChrome() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll("[data-language-label]").forEach(element => element.classList.toggle("is-active", element.dataset.languageLabel === language));
  toggle.setAttribute("aria-label", language === "nl" ? "Switch to English" : "Wissel naar Nederlands");
}

const customCategoryKey = "lohc-custom-categories";
function customCategories() {
  try { return JSON.parse(localStorage.getItem(customCategoryKey)) || []; } catch { return []; }
}
function allCategories() {
  const merged = new Map(customCategories().map(category => [category.id, category]));
  categories.forEach(category => merged.set(category.id, category));
  return [...merged.values()];
}
const categoryFor = id => allCategories().find(category => category.id === id);
function localDrafts() {
  const drafts = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith("lohc-flow-draft:")) continue;
    try {
      const flow = JSON.parse(localStorage.getItem(key));
      if (flow?.id && flow?.nl?.title && flow?.en?.title) drafts.push(flow);
    } catch { /* Ignore an invalid browser draft. */ }
  }
  return drafts;
}

function availableFlows() {
  const catalog = new Map(flowCatalog.map(flow => [flow.id, flow]));
  for (const flow of localDrafts()) {
    const publishedMatch = [...catalog.values()].find(item => item.category === flow.category && item.nl.title.trim().toLocaleLowerCase("nl") === flow.nl.title.trim().toLocaleLowerCase("nl"));
    if (publishedMatch && publishedMatch.id !== flow.id) catalog.delete(publishedMatch.id);
    catalog.set(flow.id, {
      id: flow.id, category: flow.category, _localDraft: true,
      nl: { title: flow.nl.title, description: flow.nl.description || "", keywords: flow.nl.keywords || [] },
      en: { title: flow.en.title, description: flow.en.description || "", keywords: flow.en.keywords || [] }
    });
  }
  return [...catalog.values()];
}

const flowCount = categoryId => availableFlows().filter(flow => flow.category === categoryId).length;

function categoryCard(category) {
  const count = flowCount(category.id);
  return `<button class="category-card" type="button" data-category="${category.id}" data-empty="${count === 0}">
    <span class="category-icon" aria-hidden="true">${category.icon}</span><h3>${escapeHtml(category[language].title)}</h3>
    <p>${escapeHtml(category[language].description)}</p><span class="category-meta">${count ? `${t("processes")(count)} →` : t("noProcesses")}</span>
  </button>`;
}

function flowCard(flow) {
  const category = categoryFor(flow.category);
  return `<button class="category-card" type="button" data-flow="${flow.id}"><span class="category-icon" aria-hidden="true">→</span>
    <h3>${escapeHtml(flow[language].title)}</h3><p>${escapeHtml(flow[language].description)}</p>
    <span class="category-meta">${escapeHtml(category[language].title)} →</span></button>`;
}

function bindCards() {
  document.querySelectorAll("[data-flow]").forEach(button => button.addEventListener("click", () => {
    sessionStorage.removeItem(answerStorageKey(button.dataset.flow));
    navigate(`/flow/${button.dataset.flow}`);
  }));
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => renderCategory(button.dataset.category)));
  document.querySelectorAll("[data-home-link]").forEach(link => link.addEventListener("click", event => { event.preventDefault(); renderHome(); window.scrollTo({ top: 0 }); }));
}

function renderHome(searchTerm = "") {
  const term = searchTerm.trim().toLocaleLowerCase(language);
  const flows = availableFlows();
  const matches = term ? flows.filter(flow => [flow[language].title, flow[language].description, ...(flow[language].keywords || [])].join(" ").toLocaleLowerCase(language).includes(term)) : [];
  main.innerHTML = `<section class="hero"><div class="hero-content"><p class="eyebrow">${t("eyebrow")}</p><h1>${t("heroTitle")}</h1>
    <p class="hero-copy">${t("heroCopy")}</p><label class="search-wrap"><span class="search-icon" aria-hidden="true">⌕</span>
    <input class="search-input" id="flow-search" type="search" value="${escapeHtml(searchTerm)}" placeholder="${t("searchPlaceholder")}" aria-label="${t("searchPlaceholder")}" autocomplete="off"></label></div></section>
    <section class="content-shell"><div class="section-heading"><div><h2>${term ? t("results")(matches.length) : t("categories")}</h2><p>${term ? t("searchPlaceholder") : t("categoriesCopy")}</p></div></div>
    <div class="category-grid">${term ? (matches.map(flowCard).join("") || `<div class="empty-state">${t("noResults")}</div>`) : allCategories().filter(category => flowCount(category.id) > 0).map(categoryCard).join("")}</div></section>`;
  const input = document.querySelector("#flow-search");
  input.addEventListener("input", event => renderHome(event.target.value));
  if (term) { input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); }
  bindCards();
}

function renderCategory(categoryId) {
  const category = categoryFor(categoryId);
  const flows = availableFlows().filter(flow => flow.category === categoryId);
  main.innerHTML = `<section class="content-shell"><nav class="breadcrumbs"><a href="#/" data-home-link>${t("home")}</a><span>›</span><span>${escapeHtml(category[language].title)}</span></nav>
    <div class="section-heading"><div><h2>${escapeHtml(category[language].title)}</h2><p>${escapeHtml(category[language].description)}</p></div><span class="result-count">${t("processes")(flows.length)}</span></div>
    <div class="category-grid">${flows.length ? flows.map(flowCard).join("") : `<div class="empty-state">${t("noProcesses")}</div>`}</div></section>`;
  bindCards();
}

async function loadFlow(id) {
  if (flowCache.has(id)) return flowCache.get(id);
  const localDraft = localStorage.getItem(`lohc-flow-draft:${id}`);
  if (localDraft) {
    const flow = JSON.parse(localDraft);
    flow._localDraft = true;
    flowCache.set(id, flow);
    return flow;
  }
  const catalogEntry = flowCatalog.find(flow => flow.id === id);
  if (!catalogEntry) throw new Error("Unknown flow");
  const response = await fetch(catalogEntry.file);
  if (!response.ok) throw new Error(`Unable to load ${catalogEntry.file}`);
  const flow = await response.json();
  flowCache.set(id, flow);
  return flow;
}

function nodeMap(flow) { return new Map(flow.nodes.map(node => [node.id, node])); }

function distancesFrom(startId, nodes) {
  const distances = new Map();
  const queue = [[startId, 0]];
  while (queue.length) {
    const [id, distance] = queue.shift();
    if (!id || distances.has(id)) continue;
    distances.set(id, distance);
    const node = nodes.get(id);
    if (!node) continue;
    if (node.next) queue.push([node.next, distance + 1]);
    for (const route of node.routes || []) queue.push([route.target, distance + 1]);
  }
  return distances;
}

function findMerge(routes, nodes) {
  if (routes.length < 2) return null;
  const maps = routes.map(route => distancesFrom(route.target, nodes));
  const candidates = [...maps[0].keys()].filter(id => maps.every(map => map.has(id)));
  candidates.sort((a, b) => maps.reduce((sum, map) => sum + map.get(a), 0) - maps.reduce((sum, map) => sum + map.get(b), 0));
  return candidates[0] || null;
}

function nodeCard(node) {
  const content = node[language] || node.nl;
  return `<div class="graph-node graph-node--${node.type}" data-node-id="${escapeHtml(node.id)}"><strong>${escapeHtml(content.title)}</strong>${content.detail ? `<small>${escapeHtml(content.detail)}</small>` : ""}</div>`;
}

function renderPath(nodeId, nodes, path = new Set(), stopAt = null) {
  if (nodeId === stopAt) return `<div class="graph-reference">↓ ${t("continuesAt")}: ${escapeHtml(nodes.get(nodeId)?.[language]?.title || nodes.get(nodeId)?.nl.title || nodeId)}</div>`;
  const node = nodes.get(nodeId);
  if (!node) return `<div class="graph-error">Ontbrekende stap: ${escapeHtml(nodeId)}</div>`;
  if (path.has(nodeId)) return `<div class="graph-reference">↪ ${t("continuesAt")}: ${escapeHtml(node[language]?.title || node.nl.title)}</div>`;
  const nextPath = new Set(path).add(nodeId);
  if (node.type === "decision") {
    const merge = findMerge(node.routes, nodes);
    return `<div class="graph-step graph-step--decision">${nodeCard(node)}<div class="graph-branches">${node.routes.map(route => `
      <section class="graph-route"><div class="graph-route-label">${escapeHtml(route[language] || route.nl)}</div><div class="graph-route-line" aria-hidden="true"></div>
      <div class="graph-route-content">${renderPath(route.target, nodes, nextPath, merge)}</div></section>`).join("")}</div>${merge ? `<div class="graph-arrow" aria-hidden="true">↓</div>${renderPath(merge, nodes, nextPath, stopAt)}` : ""}</div>`;
  }
  return `<div class="graph-step">${nodeCard(node)}${node.next ? `<div class="graph-arrow" aria-hidden="true">↓</div>${renderPath(node.next, nodes, nextPath, stopAt)}` : ""}</div>`;
}

function answerStorageKey(flowId) { return `lohc-flow-answers:${flowId}`; }
function getAnswers(flowId) {
  try { return JSON.parse(sessionStorage.getItem(answerStorageKey(flowId))) || {}; } catch { return {}; }
}
function saveAnswers(flowId, answers) { sessionStorage.setItem(answerStorageKey(flowId), JSON.stringify(answers)); }
function getViewMode(flowId) { return sessionStorage.getItem(`lohc-flow-mode:${flowId}`) || "guided"; }

function guidedPath(nodeId, nodes, answers, path = new Set()) {
  const node = nodes.get(nodeId);
  if (!node) return `<div class="graph-error">Ontbrekende stap</div>`;
  if (path.has(nodeId)) return `<div class="graph-reference">↪ ${t("continuesAt")}: ${escapeHtml(node[language]?.title || node.nl.title)}</div>`;
  const nextPath = new Set(path).add(nodeId);
  if (node.type === "decision") {
    const selectedId = answers[node.id];
    const selectedRoute = node.routes.find(route => route.id === selectedId);
    return `<div class="guided-decision">${nodeCard(node)}<div class="guided-answer-label">${t("chooseAnswer")}</div>
      <div class="guided-answers">${node.routes.map(route => `<button class="guided-answer${route.id === selectedId ? " is-selected" : ""}" type="button" data-answer-node="${escapeHtml(node.id)}" data-answer-route="${escapeHtml(route.id)}">${escapeHtml(route[language] || route.nl)}</button>`).join("")}</div>
      ${selectedRoute ? `<div class="graph-arrow" aria-hidden="true">↓</div>${guidedPath(selectedRoute.target, nodes, answers, nextPath)}` : ""}</div>`;
  }
  return `<div class="graph-step">${nodeCard(node)}${node.next ? `<div class="graph-arrow" aria-hidden="true">↓</div>${guidedPath(node.next, nodes, answers, nextPath)}` : ""}</div>`;
}

function guidedHistory(entry, nodes, answers) {
  const history = [];
  const visited = new Set();
  let current = entry;
  while (current && !visited.has(current)) {
    visited.add(current);
    const node = nodes.get(current);
    if (!node) break;
    if (node.type === "decision") {
      const route = node.routes.find(item => item.id === answers[node.id]);
      if (!route) break;
      history.push({ node, route });
      current = route.target;
    } else current = node.next;
  }
  return history;
}

function guidedToolbar(flow, nodes, answers, mode) {
  const history = guidedHistory(flow.entry, nodes, answers);
  return `<div class="flow-view-controls"><div class="view-toggle" role="group" aria-label="Weergave">
    <button type="button" data-view-mode="guided" class="${mode === "guided" ? "is-active" : ""}">${t("guided")}</button>
    <button type="button" data-view-mode="overview" class="${mode === "overview" ? "is-active" : ""}">${t("overview")}</button></div>
    ${mode === "guided" ? `<div class="route-progress"><strong>${t("yourRoute")}:</strong>${history.length ? history.map(item => `<span>${escapeHtml(item.node[language]?.title || item.node.nl.title)}: <b>${escapeHtml(item.route[language] || item.route.nl)}</b></span>`).join("") : `<span>—</span>`}</div>
    <div class="guided-tools"><button type="button" data-guided-back ${history.length ? "" : "disabled"}>← ${t("previousQuestion")}</button><button type="button" data-guided-reset ${history.length ? "" : "disabled"}>↺ ${t("startAgain")}</button></div>` : ""}</div>`;
}

function validateFlow(flow) {
  const errors = [];
  const ids = new Set();
  for (const node of flow.nodes) {
    if (!node.id) errors.push("Een stap mist een ID.");
    if (ids.has(node.id)) errors.push(`Dubbel ID: ${node.id}`);
    ids.add(node.id);
  }
  if (!ids.has(flow.entry)) errors.push(`Startstap ontbreekt: ${flow.entry}`);
  for (const node of flow.nodes) {
    if (node.next && !ids.has(node.next)) errors.push(`${node.id} verwijst naar ontbrekende stap ${node.next}.`);
    for (const route of node.routes || []) if (!ids.has(route.target)) errors.push(`${node.id}/${route.id} verwijst naar ontbrekende stap ${route.target}.`);
  }
  return errors;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

async function renderFlow(flowId) {
  main.innerHTML = `<div class="empty-state">${t("loading")}</div>`;
  try {
    const flow = await loadFlow(flowId);
    const category = categoryFor(flow.category);
    const content = flow[language];
    const errors = validateFlow(flow);
    const nodes = nodeMap(flow);
    const answers = getAnswers(flow.id);
    const mode = getViewMode(flow.id);
    document.title = `${content.title} · LOHC`;
    main.innerHTML = `<section class="content-shell flow-page"><nav class="breadcrumbs"><a href="#/">${t("home")}</a><span>›</span><a href="#" data-category-link>${escapeHtml(category[language].title)}</a><span>›</span><span>${escapeHtml(content.title)}</span></nav>
      <header class="flow-header"><div><span class="status-pill${flow._localDraft ? " status-pill--local" : ""}">● ${flow._localDraft ? t("localDraft") : t("draft")}</span><h1>${escapeHtml(content.title)}</h1><p>${escapeHtml(content.description)}</p></div>
      <div class="flow-actions"><a class="icon-button" href="editor.html?flow=${encodeURIComponent(flow.id)}">✎ ${t("edit")}</a>${flow._localDraft ? `<button class="icon-button" id="clear-draft" type="button">↺ ${t("usePublished")}</button>` : ""}<button class="icon-button" id="share-button" type="button">↗ ${t("share")}</button><button class="icon-button" id="print-button" type="button">▣ ${t("print")}</button></div></header>
      <div class="meta-strip"><div class="meta-item"><small>${t("owner")}</small><strong>${escapeHtml(flow.owner[language])}</strong></div><div class="meta-item"><small>${t("reviewed")}</small><strong>${formatDate(flow.reviewed)}</strong></div><div class="meta-item"><small>${t("category")}</small><strong>${escapeHtml(category[language].title)}</strong></div></div>
      ${errors.length ? `<div class="validation-banner">${errors.map(error => `<div>⚠ ${escapeHtml(error)}</div>`).join("")}</div>` : ""}
      ${guidedToolbar(flow, nodes, answers, mode)}
      <div class="flow-layout"><section class="flow-panel${mode === "guided" ? " flow-panel--guided" : ""}" aria-label="${escapeHtml(content.title)}"><div class="graph-canvas${mode === "guided" ? " graph-canvas--guided" : ""}">${mode === "guided" ? guidedPath(flow.entry, nodes, answers) : renderPath(flow.entry, nodes)}</div></section>
      <aside class="flow-sidebar"><section class="sidebar-card"><h2>${t("contacts")}</h2>${flow.contacts.map(contact => `<div class="contact"><div class="contact-details"><strong>${escapeHtml(contact[language])}</strong><a href="mailto:${contact.email}">${escapeHtml(contact.email)}</a></div><button class="copy-email" type="button" data-email="${escapeHtml(contact.email)}" aria-label="${t("copyEmail")}: ${escapeHtml(contact.email)}" title="${t("copyEmail")}">▣</button></div>`).join("")}</section>
      <section class="sidebar-card"><h2>${t("legend")}</h2><div class="legend-row"><span class="legend-shape legend-start"></span>${t("start")}</div><div class="legend-row"><span class="legend-shape legend-action"></span>${t("action")}</div><div class="legend-row"><span class="legend-shape diamond"></span>${t("decision")}</div><div class="legend-row"><span class="legend-shape legend-end"></span>${t("outcome")}</div></section></aside></div></section>`;
    document.querySelector("[data-category-link]").addEventListener("click", event => { event.preventDefault(); renderCategory(category.id); });
    document.querySelector("#print-button").addEventListener("click", () => window.print());
    document.querySelector("#share-button").addEventListener("click", shareCurrentPage);
    document.querySelector("#clear-draft")?.addEventListener("click", () => { localStorage.removeItem(`lohc-flow-draft:${flow.id}`); flowCache.delete(flow.id); renderFlow(flow.id); });
    document.querySelectorAll(".copy-email").forEach(button => button.addEventListener("click", () => copyEmail(button.dataset.email)));
    document.querySelectorAll("[data-view-mode]").forEach(button => button.addEventListener("click", () => { sessionStorage.setItem(`lohc-flow-mode:${flow.id}`, button.dataset.viewMode); renderFlow(flow.id); }));
    document.querySelectorAll("[data-answer-node]").forEach(button => button.addEventListener("click", () => {
      const history = guidedHistory(flow.entry, nodes, answers);
      const changedIndex = history.findIndex(item => item.node.id === button.dataset.answerNode);
      const keep = changedIndex >= 0 ? history.slice(0, changedIndex) : history;
      Object.keys(answers).forEach(key => delete answers[key]);
      keep.forEach(item => { answers[item.node.id] = item.route.id; });
      answers[button.dataset.answerNode] = button.dataset.answerRoute;
      saveAnswers(flow.id, answers); renderFlow(flow.id);
    }));
    document.querySelector("[data-guided-back]")?.addEventListener("click", () => { const history = guidedHistory(flow.entry, nodes, answers); const last = history.at(-1); if (last) { delete answers[last.node.id]; saveAnswers(flow.id, answers); renderFlow(flow.id); } });
    document.querySelector("[data-guided-reset]")?.addEventListener("click", () => { saveAnswers(flow.id, {}); renderFlow(flow.id); });
  } catch (error) {
    console.error(error);
    main.innerHTML = `<div class="empty-state">${t("invalidFlow")}</div>`;
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 1800);
}
async function copyEmail(email) { await navigator.clipboard.writeText(email); showToast(`${t("emailCopied")}: ${email}`); }
async function shareCurrentPage() {
  if (navigator.share) return navigator.share({ title: document.title, url: location.href });
  await navigator.clipboard.writeText(location.href); showToast(t("copied"));
}
function navigate(path) { location.hash = `#${path}`; }
async function route() {
  updateChrome(); document.title = "LOHC Proceswijzer";
  const match = location.hash.match(/^#\/flow\/(.+)$/);
  if (match) await renderFlow(match[1]); else renderHome();
  window.scrollTo({ top: 0 });
}

toggle.addEventListener("click", () => { language = language === "nl" ? "en" : "nl"; localStorage.setItem("lohc-language", language); route(); });
window.addEventListener("hashchange", route);
route();
