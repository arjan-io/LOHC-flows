import { categories, flows } from "./data.js";

const translations = {
  nl: {
    brandSubtitle: "Proceswijzer",
    help: "Hulp nodig?",
    footer: "LOHC Proceswijzer · Samen houden we de club draaiend",
    eyebrow: "Kennisbank voor de club",
    heroTitle: "Wat wil je <span>regelen?</span>",
    heroCopy: "Vind snel de juiste stappen, contactpersonen en afspraken voor iedere situatie binnen LOHC.",
    searchPlaceholder: "Zoek bijvoorbeeld ‘nieuw lid’, ‘VOG’ of ‘wedstrijd’…",
    categories: "Kies een categorie",
    categoriesCopy: "Bekijk alle processen per onderwerp",
    processes: n => `${n} ${n === 1 ? "proces" : "processen"}`,
    noProcesses: "Nog geen processen",
    results: n => `${n} ${n === 1 ? "resultaat" : "resultaten"}`,
    noResults: "Geen processen gevonden. Probeer een andere zoekterm.",
    home: "Home",
    draft: "Conceptproces",
    owner: "Proceseigenaar",
    reviewed: "Laatst gecontroleerd",
    category: "Categorie",
    contacts: "Contactpersonen",
    legend: "Legenda",
    startEnd: "Begin / uitkomst",
    action: "Actie",
    decision: "Beslissing",
    share: "Deel",
    print: "Print",
    copied: "Link gekopieerd"
  },
  en: {
    brandSubtitle: "Process guide",
    help: "Need help?",
    footer: "LOHC Process Guide · Together we keep the club running",
    eyebrow: "The club knowledge base",
    heroTitle: "What do you want to <span>arrange?</span>",
    heroCopy: "Quickly find the right steps, contacts and agreements for every situation within LOHC.",
    searchPlaceholder: "Try ‘new member’, ‘volunteer’ or ‘match’…",
    categories: "Choose a category",
    categoriesCopy: "Browse all processes by subject",
    processes: n => `${n} ${n === 1 ? "process" : "processes"}`,
    noProcesses: "No processes yet",
    results: n => `${n} ${n === 1 ? "result" : "results"}`,
    noResults: "No processes found. Try a different search term.",
    home: "Home",
    draft: "Draft process",
    owner: "Process owner",
    reviewed: "Last reviewed",
    category: "Category",
    contacts: "Contacts",
    legend: "Legend",
    startEnd: "Start / outcome",
    action: "Action",
    decision: "Decision",
    share: "Share",
    print: "Print",
    copied: "Link copied"
  }
};

let language = localStorage.getItem("lohc-language") || "nl";
const main = document.querySelector("main");
const toggle = document.querySelector("#language-toggle");
const t = key => translations[language][key];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function updateChrome() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-language-label]").forEach(element => {
    element.classList.toggle("is-active", element.dataset.languageLabel === language);
  });
  toggle.setAttribute("aria-label", language === "nl" ? "Switch to English" : "Wissel naar Nederlands");
}

function flowCount(categoryId) {
  return flows.filter(flow => flow.category === categoryId).length;
}

function categoryCard(category) {
  const count = flowCount(category.id);
  return `
    <button class="category-card" type="button" data-category="${category.id}" data-empty="${count === 0}">
      <span class="category-icon" aria-hidden="true">${category.icon}</span>
      <h3>${escapeHtml(category[language].title)}</h3>
      <p>${escapeHtml(category[language].description)}</p>
      <span class="category-meta">${count ? t("processes")(count) + " →" : t("noProcesses")}</span>
    </button>`;
}

function renderHome(searchTerm = "") {
  const term = searchTerm.trim().toLocaleLowerCase(language);
  const matchedFlows = !term ? [] : flows.filter(flow => {
    const content = [flow[language].title, flow[language].description, ...flow[language].keywords].join(" ").toLocaleLowerCase(language);
    return content.includes(term);
  });

  const cards = term
    ? matchedFlows.map(flow => {
        const category = categories.find(item => item.id === flow.category);
        return `
          <button class="category-card" type="button" data-flow="${flow.id}">
            <span class="category-icon" aria-hidden="true">→</span>
            <h3>${escapeHtml(flow[language].title)}</h3>
            <p>${escapeHtml(flow[language].description)}</p>
            <span class="category-meta">${escapeHtml(category[language].title)} →</span>
          </button>`;
      }).join("") || `<div class="empty-state">${t("noResults")}</div>`
    : categories.map(categoryCard).join("");

  main.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">${t("eyebrow")}</p>
        <h1>${t("heroTitle")}</h1>
        <p class="hero-copy">${t("heroCopy")}</p>
        <label class="search-wrap">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <span class="visually-hidden"></span>
          <input class="search-input" id="flow-search" type="search" value="${escapeHtml(searchTerm)}" placeholder="${t("searchPlaceholder")}" aria-label="${t("searchPlaceholder")}" autocomplete="off" />
        </label>
      </div>
    </section>
    <section class="content-shell">
      <div class="section-heading">
        <div>
          <h2>${term ? t("results")(matchedFlows.length) : t("categories")}</h2>
          <p>${term ? t("searchPlaceholder") : t("categoriesCopy")}</p>
        </div>
      </div>
      <div class="category-grid">${cards}</div>
    </section>`;

  const input = document.querySelector("#flow-search");
  input.addEventListener("input", event => renderHome(event.target.value));
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
  document.querySelectorAll("[data-flow]").forEach(button => button.addEventListener("click", () => navigate(`/flow/${button.dataset.flow}`)));
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => renderCategory(button.dataset.category)));
}

function renderCategory(categoryId) {
  const category = categories.find(item => item.id === categoryId);
  const categoryFlows = flows.filter(flow => flow.category === categoryId);
  main.innerHTML = `
    <section class="content-shell">
      <nav class="breadcrumbs"><a href="#/">${t("home")}</a><span>›</span><span>${escapeHtml(category[language].title)}</span></nav>
      <div class="section-heading">
        <div><h2>${escapeHtml(category[language].title)}</h2><p>${escapeHtml(category[language].description)}</p></div>
        <span class="result-count">${t("processes")(categoryFlows.length)}</span>
      </div>
      <div class="category-grid">
        ${categoryFlows.length ? categoryFlows.map(flow => `
          <button class="category-card" type="button" data-flow="${flow.id}">
            <span class="category-icon" aria-hidden="true">→</span>
            <h3>${escapeHtml(flow[language].title)}</h3>
            <p>${escapeHtml(flow[language].description)}</p>
            <span class="category-meta">${t("draft")} →</span>
          </button>`).join("") : `<div class="empty-state">${t("noProcesses")}</div>`}
      </div>
    </section>`;
  document.querySelectorAll("[data-flow]").forEach(button => button.addEventListener("click", () => navigate(`/flow/${button.dataset.flow}`)));
}

function stepTemplate(step) {
  if (step.type === "decision") {
    return `<li class="flow-step"><div class="decision-block"><div class="decision"><strong>${escapeHtml(step.title)}</strong></div><div class="branches">${step.branches.map((branch, index) => `<div class="branch"><b>${index === 0 ? branch.split("—")[0] : branch.split("—")[0]}</b><span>${escapeHtml(branch.includes("—") ? branch.split("—").slice(1).join("—").trim() : branch)}</span></div>`).join("")}</div></div></li>`;
  }
  return `<li class="flow-step"><div class="node ${step.type}"><strong>${escapeHtml(step.title)}</strong>${step.detail ? `<small>${escapeHtml(step.detail)}</small>` : ""}</div></li>`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function renderFlow(flowId) {
  const flow = flows.find(item => item.id === flowId);
  if (!flow) return renderHome();
  const category = categories.find(item => item.id === flow.category);
  const content = flow[language];
  document.title = `${content.title} · LOHC`;
  main.innerHTML = `
    <section class="content-shell">
      <nav class="breadcrumbs"><a href="#/">${t("home")}</a><span>›</span><a href="#" data-category-link>${escapeHtml(category[language].title)}</a><span>›</span><span>${escapeHtml(content.title)}</span></nav>
      <header class="flow-header">
        <div>
          <span class="status-pill">● ${t("draft")}</span>
          <h1>${escapeHtml(content.title)}</h1>
          <p>${escapeHtml(content.description)}</p>
        </div>
        <div class="flow-actions">
          <button class="icon-button" id="share-button" type="button">↗ ${t("share")}</button>
          <button class="icon-button" id="print-button" type="button">▣ ${t("print")}</button>
        </div>
      </header>
      <div class="meta-strip">
        <div class="meta-item"><small>${t("owner")}</small><strong>${escapeHtml(flow.owner[language])}</strong></div>
        <div class="meta-item"><small>${t("reviewed")}</small><strong>${formatDate(flow.reviewed)}</strong></div>
        <div class="meta-item"><small>${t("category")}</small><strong>${escapeHtml(category[language].title)}</strong></div>
      </div>
      <div class="flow-layout">
        <section class="flow-panel" aria-label="${escapeHtml(content.title)}"><ol class="flow-list">${content.steps.map(stepTemplate).join("")}</ol></section>
        <aside class="flow-sidebar">
          <section class="sidebar-card"><h2>${t("contacts")}</h2>${flow.contacts.map(contact => `<div class="contact"><strong>${escapeHtml(contact[language])}</strong><a href="mailto:${contact.email}">${escapeHtml(contact.email)}</a></div>`).join("")}</section>
          <section class="sidebar-card"><h2>${t("legend")}</h2><div class="legend-row"><span class="legend-shape"></span>${t("startEnd")}</div><div class="legend-row"><span class="legend-shape" style="border-color:var(--navy);background:white"></span>${t("action")}</div><div class="legend-row"><span class="legend-shape diamond"></span>${t("decision")}</div></section>
        </aside>
      </div>
    </section>`;
  document.querySelector("[data-category-link]").addEventListener("click", event => { event.preventDefault(); renderCategory(category.id); });
  document.querySelector("#print-button").addEventListener("click", () => window.print());
  document.querySelector("#share-button").addEventListener("click", shareCurrentPage);
}

async function shareCurrentPage() {
  if (navigator.share) {
    await navigator.share({ title: document.title, url: location.href });
    return;
  }
  await navigator.clipboard.writeText(location.href);
  const toast = document.querySelector("#toast");
  toast.textContent = t("copied");
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function navigate(path) {
  location.hash = `#${path}`;
}

function route() {
  updateChrome();
  document.title = "LOHC Proceswijzer";
  const match = location.hash.match(/^#\/flow\/(.+)$/);
  match ? renderFlow(match[1]) : renderHome();
  window.scrollTo({ top: 0 });
}

toggle.addEventListener("click", () => {
  language = language === "nl" ? "en" : "nl";
  localStorage.setItem("lohc-language", language);
  route();
});
window.addEventListener("hashchange", route);
route();
