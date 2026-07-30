const state = {
  content: null,
  activeFilter: "전체",
  query: "",
};

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
      '<div class="page-width empty-state"><strong>교육정보를 불러오지 못했습니다.</strong><p>페이지를 새로고침해 주세요.</p></div>';
    showToast("콘텐츠 로딩 오류가 발생했습니다.");
  }
}

function renderPage() {
  const {
    meta,
    brand,
    hero,
    navigation,
    educationSystem,
    application,
    programsSection,
    programs,
    faqSection,
    faqs,
    contactSection,
    contacts,
    footer,
  } = state.content;

  document.title = meta.pageTitle;
  qs('meta[name="description"]').content = meta.description;
  setText("#brand-title", brand.title);
  setText("#brand-subtitle", brand.subtitle);
  setText("#hero-eyebrow", hero.eyebrow);
  qs("#hero-title").innerHTML =
    `${escapeHtml(hero.title)} <em>${escapeHtml(hero.accent)}</em>`;
  setText("#hero-description", hero.description);

  qs("#primary-nav").innerHTML = navigation
    .map(
      (item, index) =>
        `<a href="#${escapeHtml(item.id)}" class="${index === 0 ? "is-active" : ""}">${escapeHtml(item.label)}</a>`,
    )
    .join("");

  renderHeading("#system-heading", educationSystem);
  qs("#direction-card").innerHTML = `
    <span>${escapeHtml(educationSystem.directionLabel)}</span>
    <h3>${escapeHtml(educationSystem.direction)}</h3>`;
  qs("#system-list").innerHTML = educationSystem.items
    .map(
      (item) => `
        <article class="system-card">
          <span>${escapeHtml(item.label)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>`,
    )
    .join("");
  qs("#term-note").innerHTML = `
    <strong>${escapeHtml(educationSystem.termsLabel)}</strong>
    ${educationSystem.terms
      .map((term) => `<span><b>${escapeHtml(term.name)}</b> ${escapeHtml(term.description)}</span>`)
      .join("")}`;

  renderHeading("#application-heading", application);
  qs("#application-list").innerHTML = application.steps
    .map(
      (step, index) => `
        <li class="step-item">
          <span class="step-number">STEP ${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.description)}</p>
          </div>
        </li>`,
    )
    .join("");

  renderHeading("#programs-heading", programsSection);
  qs("#program-search").placeholder = programsSection.searchPlaceholder;
  qs("#empty-state").innerHTML = `
    <strong>${escapeHtml(programsSection.emptyTitle)}</strong>
    <p>${escapeHtml(programsSection.emptyDescription)}</p>`;

  const filters = [programsSection.allFilter, ...new Set(programs.map((item) => item.category))];
  state.activeFilter = programsSection.allFilter;
  qs("#filter-list").innerHTML = filters
    .map(
      (filter, index) => `
        <button class="filter-button ${index === 0 ? "is-active" : ""}"
          type="button" data-filter="${escapeHtml(filter)}" aria-pressed="${index === 0}">
          ${escapeHtml(filter)}
        </button>`,
    )
    .join("");

  renderHeading("#faq-heading", faqSection);
  qs("#faq-list").innerHTML = faqs
    .map(
      (faq, index) => `
        <article class="faq-item">
          <button class="faq-question" type="button" aria-expanded="false"
            aria-controls="faq-answer-${index}">
            Q. ${escapeHtml(faq.question)}
          </button>
          <div class="faq-answer" id="faq-answer-${index}">
            <p>${escapeHtml(faq.answer)}</p>
          </div>
        </article>`,
    )
    .join("");

  renderHeading("#contact-heading", contactSection);
  qs("#contact-list").innerHTML = contacts
    .map(
      (contact) => `
        <article class="contact-person">
          <div class="contact-person__role">
            <span>${escapeHtml(contact.role)}</span>
            <strong>${escapeHtml(contact.name)}</strong>
          </div>
          <div class="contact-person__details">
            <span>${escapeHtml(contact.department)}</span>
            <a href="tel:${phoneHref(contact.phone)}">${escapeHtml(contact.phone)}</a>
            <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>
          </div>
        </article>`,
    )
    .join("");

  setText("#footer-title", footer.title);
  setText("#footer-note", footer.note.replace("{date}", formatDate(meta.lastUpdated)));
  bindDynamicEvents();
  setupNavigation();
  renderPrograms();
}

function renderHeading(selector, section) {
  qs(selector).innerHTML = `
    <span>${escapeHtml(section.kicker)}</span>
    <h2>${escapeHtml(section.title)}</h2>
    ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}`;
}

function renderPrograms() {
  const { programs, programsSection } = state.content;
  const query = normalize(state.query);
  const filtered = programs.filter((program) => {
    const matchesFilter =
      state.activeFilter === programsSection.allFilter ||
      program.category === state.activeFilter;
    const haystack = normalize(
      [
        program.category,
        program.title,
        program.description,
        ...(program.keywords || []),
        ...Object.values(program.meta || {}),
      ].join(" "),
    );
    return matchesFilter && (!query || haystack.includes(query));
  });

  qs("#result-count").innerHTML =
    `${escapeHtml(programsSection.resultPrefix)} <b>${filtered.length}</b>${escapeHtml(programsSection.resultSuffix)}`;
  qs("#empty-state").hidden = filtered.length > 0;
  qs("#program-list").innerHTML = filtered
    .map(
      (program, index) => `
        <article class="program-card">
          <div class="program-card__header">
            <span>PROGRAM ${String(index + 1).padStart(2, "0")}</span>
            <strong>${escapeHtml(program.category)}</strong>
          </div>
          <div class="program-card__body">
            <h3>${escapeHtml(program.title)}</h3>
            <p>${escapeHtml(program.description)}</p>
            <dl class="program-card__meta">
              ${Object.entries(program.meta)
                .map(
                  ([key, value]) =>
                    `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`,
                )
                .join("")}
            </dl>
          </div>
          <div class="program-card__actions">
            ${program.links
              .map(
                (link) => `
                  <a class="program-link" href="${safeUrl(link.url)}" target="_blank"
                    rel="noopener noreferrer">${escapeHtml(link.label)}</a>`,
              )
              .join("")}
          </div>
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

  qs("#program-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderPrograms();
  });

  qsa(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const open = !item.classList.contains("is-open");
      qsa(".faq-item").forEach((faq) => {
        faq.classList.remove("is-open");
        qs(".faq-question", faq).setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    });
  });
}

function setupNavigation() {
  const sections = qsa("main section[id]");
  const links = qsa(".primary-nav a");
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) =>
        link.classList.toggle("is-active", link.hash === `#${visible.target.id}`),
      );
    },
    { rootMargin: "-25% 0px -65% 0px", threshold: [0, 0.25, 0.5] },
  );
  sections.forEach((section) => observer.observe(section));
}

function setText(selector, value) {
  qs(selector).textContent = value;
}

function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function normalize(value) {
  return String(value).toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
}

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
  } catch {
    return "#";
  }
}

function phoneHref(value) {
  return String(value).replace(/[^\d+]/g, "");
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
}

loadContent();
