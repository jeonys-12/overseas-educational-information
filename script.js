"use strict";

const state = { content: null, filter: "", query: "" };
const $ = (id) => document.getElementById(id);
const html = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const join = (items, template) => items.map(template).join("");
const normalize = (value) => String(value ?? "").toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
const richText = (value) => html(value).replace(/\*\*(.+?)\*\*/g, "<em>$1</em>");
const phoneHref = (value) => String(value).replace(/[^\d+]/g, "");

function safeUrl(value) {
  try {
    const url = new URL(value, location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function renderHeading(id, section) {
  const sectionNumber = String(section.eyebrow ?? "").match(/\d+/)?.[0] ?? "";
  $(`${id}-heading`).innerHTML = `
    <span>${html(sectionNumber)}</span>
    <h2 id="${id}-title">${html(section.title)}</h2>
    ${section.description ? `<p>${html(section.description)}</p>` : ""}`;
}

function renderHeader({ meta, navigation }) {
  document.title = meta.pageTitle;
  document.querySelector('meta[name="description"]').content = meta.description;
  $("brand-title").textContent = meta.brandTitle;
  $("brand-subtitle").textContent = meta.brandSubtitle;
  $("hero-eyebrow").textContent = meta.hero.eyebrow;
  $("hero-title").innerHTML = richText(meta.hero.title);
  $("hero-description").textContent = meta.hero.description;
  $("hero-summary").innerHTML = join(
    meta.hero.summary,
    (item) => `<span class="summary-chip">${html(item)}</span>`,
  );
  $("top-nav").innerHTML = join(
    navigation,
    (item, index) => `<a href="#${html(item.id)}"${index ? "" : ' class="is-active"'}>${html(item.label)}</a>`,
  );
}

function renderSystem(operation) {
  $("direction-card").innerHTML = `
    <strong>${html(operation.directionLabel)}</strong>
    <p>${html(operation.direction)}</p>`;
  $("system-summary").innerHTML = join(operation.summary, (item) => `
    <article class="summary-card">
      <span>${html(item.label)}</span>
      <strong>${html(item.title)}</strong>
      <small>${html(item.detail)}</small>
    </article>`);
  $("principle-card").innerHTML = `
    <strong>${html(operation.principleLabel)}</strong>
    <p>${html(operation.principle)}</p>`;
  $("operation-list").innerHTML = join(operation.items, (item, index) => `
    <article class="operation-item">
      <b>${String(index + 1).padStart(2, "0")}</b>
      <h3>${html(item.title)}</h3>
      <p>${html(item.description)}</p>
    </article>`);
  $("term-note").innerHTML = `
    <strong>${html(operation.termsLabel)}</strong>
    ${join(operation.terms, (item) => `<span><b>${html(item.term)}</b> ${html(item.meaning)}</span>`)}`;
}

function renderProcess(process, ui) {
  $("process-list").innerHTML = join(process, (item, index) => `
    <li class="process-item">
      <span>${html(ui.stepLabel)} ${String(index + 1).padStart(2, "0")}</span>
      <h3>${html(item.title)}</h3>
      <p>${html(item.description)}</p>
    </li>`);
}

function renderProgramTools({ programs, ui }) {
  $("search-label").textContent = ui.searchLabel;
  $("program-search").placeholder = ui.searchPlaceholder;
  $("empty-state").innerHTML = `<strong>${html(ui.emptyTitle)}</strong><p>${html(ui.emptyDescription)}</p>`;

  const filters = [ui.allFilter, ...new Set(programs.map(({ category }) => category))];
  state.filter = ui.allFilter;
  $("filter-list").innerHTML = join(filters, (filter, index) => `
    <button class="filter-button${index ? "" : " is-active"}" type="button"
      data-filter="${html(filter)}" aria-pressed="${index === 0}">${html(filter)}</button>`);
}

function renderPrograms() {
  const { programs, ui } = state.content;
  const query = normalize(state.query);
  const visible = programs.filter((program) => {
    const inCategory = state.filter === ui.allFilter || program.category === state.filter;
    const searchable = [
      program.category,
      program.title,
      program.description,
      ...(program.keywords ?? []),
      ...Object.values(program.meta ?? {}),
    ].join(" ");
    return inCategory && (!query || normalize(searchable).includes(query));
  });

  $("result-count").innerHTML = `${html(ui.resultPrefix)} <b>${visible.length}</b>${html(ui.resultSuffix)}`;
  $("empty-state").hidden = visible.length > 0;
  $("program-list").hidden = visible.length === 0;
  $("program-list").innerHTML = join(visible, (program, index) => `
    <article class="program-card">
      <div class="program-category">
        <span>${html(ui.programLabel)} ${String(index + 1).padStart(2, "0")}</span>
        <strong>${html(program.category)}</strong>
      </div>
      <div class="program-body">
        <h3>${html(program.title)}</h3>
        <p>${html(program.description)}</p>
        <dl>${join(Object.entries(program.meta), ([key, value]) =>
          `<div><dt>${html(key)}</dt><dd>${html(value)}</dd></div>`)}</dl>
      </div>
      <div class="program-actions">${join(program.links, (link) =>
        `<a href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer">${html(link.label)}</a>`)}</div>
    </article>`);
}

function renderFaq(faqs) {
  $("faq-list").innerHTML = join(faqs, (faq, index) => `
    <article class="faq-item">
      <button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-${index}">
        <span>Q. ${html(faq.question)}</span>
      </button>
      <div class="faq-answer" id="faq-${index}"><div><p>${html(faq.answer)}</p></div></div>
    </article>`);
}

function renderContacts(contacts) {
  $("contact-list").innerHTML = join(contacts, (contact) => `
    <article class="contact-card">
      <span class="contact-kicker">EDUCATION MANAGER</span>
      <h3>${html(contact.role)}</h3>
      <dl class="contact-details">
        <div><dt>부서</dt><dd>${html(contact.department)}</dd></div>
        <div><dt>담당</dt><dd>${html(contact.name)}</dd></div>
        <div><dt>연락처</dt><dd><a href="tel:${phoneHref(contact.phone)}">${html(contact.phone)}</a></dd></div>
        <div><dt>이메일</dt><dd><a href="mailto:${html(contact.email)}">${html(contact.email)}</a></dd></div>
      </dl>
    </article>`);
}

function observeSections() {
  const links = [...document.querySelectorAll(".top-nav a")];
  const observer = new IntersectionObserver((entries) => {
    const current = entries
      .filter(({ isIntersecting }) => isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!current) return;
    links.forEach((link) => link.classList.toggle("is-active", link.hash === `#${current.target.id}`));
  }, { rootMargin: "-22% 0px -65%", threshold: [0, 0.2, 0.5] });

  document.querySelectorAll("main section[id]").forEach((section) => observer.observe(section));
}

function renderPage() {
  const content = state.content;
  renderHeader(content);
  Object.entries(content.sections)
    .filter(([id]) => ["system", "process", "programs", "faq"].includes(id))
    .forEach(([id, section]) => renderHeading(id, section));
  renderSystem(content.operation);
  renderProcess(content.process, content.ui);
  renderProgramTools(content);
  renderFaq(content.faqs);
  renderContacts(content.contacts);
  renderPrograms();

  $("footer-title").textContent = content.meta.projectName;
  $("footer-detail").textContent =
    `${content.meta.department} · ${content.ui.updatedLabel} ${formatDate(content.meta.lastUpdated)}`;
  $("footer-top").textContent = content.ui.topButton;
  observeSections();
}

function bindEvents() {
  $("program-search").addEventListener("input", ({ target }) => {
    state.query = target.value;
    renderPrograms();
  });

  $("filter-list").addEventListener("click", ({ target }) => {
    const button = target.closest(".filter-button");
    if (!button) return;
    state.filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderPrograms();
  });

  $("faq-list").addEventListener("click", ({ target }) => {
    const button = target.closest(".faq-question");
    if (!button) return;
    const selected = button.closest(".faq-item");
    const open = !selected.classList.contains("is-open");
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.remove("is-open");
      item.querySelector(".faq-question").setAttribute("aria-expanded", "false");
    });
    selected.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
  });
}

async function init() {
  try {
    const response = await fetch("data/content.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.content = await response.json();
    renderPage();
    bindEvents();
  } catch (error) {
    console.error("교육정보 로딩 오류", error);
    $("main-content").innerHTML = `
      <div class="container load-error">
        <strong>교육정보를 불러오지 못했습니다.</strong>
        <p>잠시 후 페이지를 새로고침해 주세요.</p>
      </div>`;
  }
}

init();
