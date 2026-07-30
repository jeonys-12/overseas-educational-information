const state = { content: null, activeFilter: "전체", query: "" };
const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];

async function loadContent() {
  try {
    const response = await fetch("data/content.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.content = await response.json();
    renderPage();
  } catch (error) {
    console.error("교육정보를 불러오지 못했습니다.", error);
    qs("#main-content").innerHTML =
      '<div class="page-stack"><div class="empty-state"><strong>교육정보를 불러오지 못했습니다.</strong><p>페이지를 새로고침해 주세요.</p></div></div>';
    showToast("콘텐츠 로딩 오류가 발생했습니다.");
  }
}

function renderPage() {
  const { meta, navigation, sections, operation, programs, process, faqs, contacts, ui } =
    state.content;

  document.title = meta.pageTitle;
  qs('meta[name="description"]').content = meta.description;
  setText("#brand-title", meta.brandTitle);
  setText("#brand-subtitle", meta.brandSubtitle);
  setText("#hero-eyebrow", meta.hero.eyebrow);
  qs("#hero-title").innerHTML = richText(meta.hero.title);
  setText("#hero-description", meta.hero.description);
  qs("#hero-summary").innerHTML = meta.hero.summary
    .map((item) => `<span class="summary-chip">${escapeHtml(item)}</span>`)
    .join("");

  qs("#top-nav").innerHTML = navigation
    .map(
      (item, index) =>
        `<a href="#${escapeHtml(item.id)}" class="${index === 0 ? "is-active" : ""}">${escapeHtml(item.label)}</a>`,
    )
    .join("");

  renderHeading("system", sections.system);
  renderHeading("process", sections.process);
  renderHeading("programs", sections.programs);
  renderHeading("faq", sections.faq);
  setText("#contact-eyebrow", sections.contact.eyebrow);
  setText("#contact-title", sections.contact.title);

  qs("#direction-card").innerHTML =
    `<strong>${escapeHtml(operation.directionLabel)}</strong><p>${escapeHtml(operation.direction)}</p>`;
  qs("#system-summary").innerHTML = operation.summary
    .map(
      (item) =>
        `<article class="summary-card"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></article>`,
    )
    .join("");
  qs("#principle-card").innerHTML =
    `<strong>${escapeHtml(operation.principleLabel)}</strong><p>${escapeHtml(operation.principle)}</p>`;
  qs("#operation-list").innerHTML = operation.items
    .map(
      (item, index) =>
        `<article class="operation-item"><b>${String(index + 1).padStart(2, "0")}</b><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></article>`,
    )
    .join("");
  qs("#term-note").innerHTML =
    `<strong>${escapeHtml(operation.termsLabel)}</strong>${operation.terms
      .map((item) => `<span><b>${escapeHtml(item.term)}</b> ${escapeHtml(item.meaning)}</span>`)
      .join("")}`;

  qs("#process-list").innerHTML = process
    .map(
      (item, index) =>
        `<li class="process-item"><span class="process-item__number">${escapeHtml(ui.stepLabel)} ${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></li>`,
    )
    .join("");

  setText("#search-label", ui.searchLabel);
  qs("#program-search").placeholder = ui.searchPlaceholder;
  qs("#empty-state").innerHTML =
    `<strong>${escapeHtml(ui.emptyTitle)}</strong><p>${escapeHtml(ui.emptyDescription)}</p>`;
  const filters = [ui.allFilter, ...new Set(programs.map((program) => program.category))];
  state.activeFilter = ui.allFilter;
  qs("#filter-list").innerHTML = filters
    .map(
      (filter, index) =>
        `<button class="filter-button ${index === 0 ? "is-active" : ""}" type="button" data-filter="${escapeHtml(filter)}" aria-pressed="${index === 0}">${escapeHtml(filter)}</button>`,
    )
    .join("");

  qs("#faq-list").innerHTML = faqs
    .map(
      (faq, index) =>
        `<article class="faq-item"><button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}"><span>Q. ${escapeHtml(faq.question)}</span></button><div class="faq-answer" id="faq-answer-${index}"><div><p>${escapeHtml(faq.answer)}</p></div></div></article>`,
    )
    .join("");

  qs("#contact-list").innerHTML = contacts
    .map(
      (contact) =>
        `<article class="contact-card"><span>${escapeHtml(contact.role)}</span><h3>${escapeHtml(contact.name)}</h3><small>${escapeHtml(contact.department)}</small><a href="tel:${phoneHref(contact.phone)}" aria-label="${escapeHtml(contact.name)} 전화">${escapeHtml(contact.phone)}</a><a href="mailto:${escapeHtml(contact.email)}" aria-label="${escapeHtml(contact.name)} 이메일">${escapeHtml(contact.email)}</a></article>`,
    )
    .join("");

  setText("#footer-title", meta.projectName);
  setText("#footer-detail", `${meta.department} · ${ui.updatedLabel} ${formatDate(meta.lastUpdated)}`);
  setText("#footer-top", ui.topButton);
  bindDynamicEvents();
  renderPrograms();
  setupSectionObserver();
}

function renderHeading(id, section) {
  qs(`#${id}-heading`).innerHTML =
    `<span>${escapeHtml(section.eyebrow)}</span><h2 id="${id}-title">${escapeHtml(section.title)}</h2>${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}`;
}

function renderPrograms() {
  const { programs, ui } = state.content;
  const query = normalize(state.query);
  const filtered = programs.filter((program) => {
    const matchesFilter = state.activeFilter === ui.allFilter || program.category === state.activeFilter;
    const haystack = normalize(
      [program.category, program.title, program.description, ...(program.keywords || []), ...Object.values(program.meta || {})].join(" "),
    );
    return matchesFilter && (!query || haystack.includes(query));
  });

  qs("#result-count").innerHTML = `${escapeHtml(ui.resultPrefix)} <b>${filtered.length}</b>${escapeHtml(ui.resultSuffix)}`;
  qs("#empty-state").hidden = filtered.length > 0;
  qs("#program-list").innerHTML = filtered
    .map(
      (program, index) =>
        `<article class="program-card">
          <div class="program-card__category"><span>${escapeHtml(ui.programLabel)} ${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(program.category)}</strong></div>
          <div class="program-card__body"><h3>${escapeHtml(program.title)}</h3><p>${escapeHtml(program.description)}</p>
            <dl class="program-card__meta">${Object.entries(program.meta)
              .map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`)
              .join("")}</dl>
          </div>
          <div class="program-card__actions">${program.links
            .map((link) => `<a class="program-link" href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`)
            .join("")}</div>
        </article>`,
    )
    .join("");
}

function bindDynamicEvents() {
  qsa(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      qsa(".filter-button").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderPrograms();
    });
  });
  qsa(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const willOpen = !item.classList.contains("is-open");
      qsa(".faq-item").forEach((faq) => {
        faq.classList.remove("is-open");
        qs(".faq-question", faq).setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

function setupStaticEvents() {
  qs("#program-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderPrograms();
  });
}

function setupSectionObserver() {
  const sections = qsa("main section[id]");
  const navLinks = qsa(".top-nav a");
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) =>
        link.classList.toggle("is-active", link.hash === `#${visible.target.id}`),
      );
    },
    { rootMargin: "-22% 0px -65% 0px", threshold: [0, 0.2, 0.5] },
  );
  sections.forEach((section) => observer.observe(section));
}

function setText(selector, value) { qs(selector).textContent = value; }
function normalize(value) { return String(value).toLocaleLowerCase("ko-KR").replace(/\s+/g, ""); }
function richText(value) { return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<em>$1</em>"); }
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function safeUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
}
function phoneHref(value) { return String(value).replace(/[^\d+]/g, ""); }
function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

setupStaticEvents();
loadContent();
