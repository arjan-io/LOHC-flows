import { categories, flowCatalog } from "./data.js";

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
    legend: "Legenda", startEnd: "Begin / uitkomst", action: "Actie", decision: "Beslissing", note: "Opmerking",
    share: "Deel", print: "Print", edit: "Bewerk flow", copied: "Link gekopieerd", copyEmail: "Kopieer e-mailadres",
    emailCopied: "E-mailadres gekopieerd", loading: "Proces laden…", invalidFlow: "Deze flow kon niet worden geladen.",
    continuesAt: "Vervolg bij"
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
    legend: "Legend", startEnd: "Start / outcome", action: "Action", decision: "Decision", note: "Note",
    share: "Share", print: "Print", edit: "Edit flow", copied: "Link copied", copyEmail: "Copy email address",
    emailCopied: "Email address copied", loading: "Loading process…", invalidFlow: "This flow could not be loaded.",
    continuesAt: "Continues at"
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

const categoryFor = id => categories.find(category => category.id === id);
const flowCount = categoryId => flowCatalog.filter(flow => flow.category === categoryId).length;

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
  document.querySelectorAll("[data-flow]").forEach(button => button.addEventListener("click", () => navigate(`/flow/${button.dataset.flow}`)));
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => renderCategory(button.dataset.category)));
}

function renderHome(searchTerm = "") {
  const term = searchTerm.trim().toLocaleLowerCase(language);
  const matches = term ? flowCatalog.filter(flow => [flow[language].title, flow[language].description, ...flow[language].keywords].join(" ").toLocaleLowerCase(language).includes(term)) : [];
  main.innerHTML = `<section class="hero"><div class="hero-content"><p class="eyebrow">${t("eyebrow")}</p><h1>${t("heroTitle")}</h1>
    <p class="hero-copy">${t("heroCopy")}</p><label class="search-wrap"><span class="search-icon" aria-hidden="true">⌕</span>
    <input class="search-input" id="flow-search" type="search" value="${escapeHtml(searchTerm)}" placeholder="${t("searchPlaceholder")}" aria-label="${t("searchPlaceholder")}" autocomplete="off"></label></div></section>
    <section class="content-shell"><div class="section-heading"><div><h2>${term ? t("results")(matches.length) : t("categories")}</h2><p>${term ? t("searchPlaceholder") : t("categoriesCopy")}</p></div></div>
    <div class="category-grid">${term ? (matches.map(flowCard).join("") || `<div class="empty-state">${t("noResults")}</div>`) : categories.map(categoryCard).join("")}</div></section>`;
  const input = document.querySelector("#flow-search");
  input.addEventListener("input", event => renderHome(event.target.value));
  if (term) { input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); }
  bindCards();
}

function renderCategory(categoryId) {
  const category = categoryFor(categoryId);
  const flows = flowCatalog.filter(flow => flow.category === categoryId);
  main.innerHTML = `<section class="content-shell"><nav class="breadcrumbs"><a href="#/">${t("home")}</a><span>›</span><span>${escapeHtml(category[language].title)}</span></nav>
    <div class="section-heading"><div><h2>${escapeHtml(category[language].title)}</h2><p>${escapeHtml(category[language].description)}</p></div><span class="result-count">${t("processes")(flows.length)}</span></div>
    <div class="category-grid">${flows.length ? flows.map(flowCard).join("") : `<div class="empty-state">${t("noProcesses")}</div>`}</div></section>`;
  bindCards();
}

async function loadFlow(id) {
  if (flowCache.has(id)) return flowCache.get(id);
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
    document.title = `${content.title} · LOHC`;
    main.innerHTML = `<section class="content-shell flow-page"><nav class="breadcrumbs"><a href="#/">${t("home")}</a><span>›</span><a href="#" data-category-link>${escapeHtml(category[language].title)}</a><span>›</span><span>${escapeHtml(content.title)}</span></nav>
      <header class="flow-header"><div><span class="status-pill">● ${t("draft")}</span><h1>${escapeHtml(content.title)}</h1><p>${escapeHtml(content.description)}</p></div>
      <div class="flow-actions"><a class="icon-button" href="editor.html?flow=${encodeURIComponent(flow.id)}">✎ ${t("edit")}</a><button class="icon-button" id="share-button" type="button">↗ ${t("share")}</button><button class="icon-button" id="print-button" type="button">▣ ${t("print")}</button></div></header>
      <div class="meta-strip"><div class="meta-item"><small>${t("owner")}</small><strong>${escapeHtml(flow.owner[language])}</strong></div><div class="meta-item"><small>${t("reviewed")}</small><strong>${formatDate(flow.reviewed)}</strong></div><div class="meta-item"><small>${t("category")}</small><strong>${escapeHtml(category[language].title)}</strong></div></div>
      ${errors.length ? `<div class="validation-banner">${errors.map(error => `<div>⚠ ${escapeHtml(error)}</div>`).join("")}</div>` : ""}
      <div class="flow-layout"><section class="flow-panel" aria-label="${escapeHtml(content.title)}"><div class="graph-canvas">${renderPath(flow.entry, nodeMap(flow))}</div></section>
      <aside class="flow-sidebar"><section class="sidebar-card"><h2>${t("contacts")}</h2>${flow.contacts.map(contact => `<div class="contact"><div class="contact-details"><strong>${escapeHtml(contact[language])}</strong><a href="mailto:${contact.email}">${escapeHtml(contact.email)}</a></div><button class="copy-email" type="button" data-email="${escapeHtml(contact.email)}" aria-label="${t("copyEmail")}: ${escapeHtml(contact.email)}" title="${t("copyEmail")}">▣</button></div>`).join("")}</section>
      <section class="sidebar-card"><h2>${t("legend")}</h2><div class="legend-row"><span class="legend-shape"></span>${t("startEnd")}</div><div class="legend-row"><span class="legend-shape legend-action"></span>${t("action")}</div><div class="legend-row"><span class="legend-shape diamond"></span>${t("decision")}</div></section></aside></div></section>`;
    document.querySelector("[data-category-link]").addEventListener("click", event => { event.preventDefault(); renderCategory(category.id); });
    document.querySelector("#print-button").addEventListener("click", () => window.print());
    document.querySelector("#share-button").addEventListener("click", shareCurrentPage);
    document.querySelectorAll(".copy-email").forEach(button => button.addEventListener("click", () => copyEmail(button.dataset.email)));
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
