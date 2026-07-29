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
    qs("#notice-list").innerHTML =
      "<span>교육정보를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</span>";
    showToast("콘텐츠 로딩 오류가 발생했습니다.");
  }
}

function renderPage() {
  const { meta, notices, operation, programs, process, resources, faqs, contacts } =
    state.content;

  document.title = meta.pageTitle;
  qs("#hero-target").textContent = meta.targetShort;
  qs("#target-title").textContent = meta.targetShort;
  qs("#target-detail").textContent = meta.targetDetail;

  const notice = notices[0];
  qs("#notice-list").innerHTML = notice
    ? `<span>${escapeHtml(notice.text)}</span><time datetime="${escapeHtml(notice.date)}">${formatDate(notice.date)}</time>`
    : "<span>등록된 공지사항이 없습니다.</span>";

  qs("#operation-list").innerHTML = operation
    .map(
      (item, index) => `
        <article class="operation-card">
          <span class="operation-card__number">0${index + 1}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>`,
    )
    .join("");

  const filters = ["전체", ...new Set(programs.map((program) => program.category))];
  qs("#filter-list").innerHTML = filters
    .map(
      (filter) => `
        <button class="filter-button ${filter === "전체" ? "is-active" : ""}"
          type="button" data-filter="${escapeHtml(filter)}" aria-pressed="${filter === "전체"}">
          ${escapeHtml(filter)}
        </button>`,
    )
    .join("");

  qs("#process-list").innerHTML = process
    .map(
      (item, index) => `
        <li class="process-item">
          <span class="process-item__number">STEP ${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </li>`,
    )
    .join("");

  qs("#resource-list").innerHTML = resources
    .map(
      (resource) => `
        <a class="resource-card" href="${safeUrl(resource.url)}" target="_blank" rel="noopener noreferrer">
          <span class="resource-card__icon">${escapeHtml(resource.type)}</span>
          <span>
            <strong>${escapeHtml(resource.title)}</strong>
            <small>${escapeHtml(resource.description)}</small>
          </span>
          <span class="resource-card__arrow" aria-hidden="true">↗</span>
        </a>`,
    )
    .join("");

  qs("#faq-list").innerHTML = faqs
    .map(
      (faq, index) => `
        <article class="faq-item">
          <button class="faq-question" type="button" aria-expanded="false"
            aria-controls="faq-answer-${index}">
            <span>Q. ${escapeHtml(faq.question)}</span>
          </button>
          <div class="faq-answer" id="faq-answer-${index}">
            <p>${escapeHtml(faq.answer)}</p>
          </div>
        </article>`,
    )
    .join("");

  qs("#contact-list").innerHTML = contacts
    .map(
      (contact) => `
        <article class="contact-card">
          <span class="contact-card__role">${escapeHtml(contact.role)}</span>
          <h3>${escapeHtml(contact.name)}</h3>
          <dl>
            <dt>부서</dt><dd>${escapeHtml(contact.department)}</dd>
            <dt>전화</dt><dd><a href="tel:${phoneHref(contact.phone)}">${escapeHtml(contact.phone)}</a></dd>
            <dt>이메일</dt><dd><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></dd>
          </dl>
        </article>`,
    )
    .join("");

  bindDynamicEvents();
  renderPrograms();
}

function renderPrograms() {
  const programs = state.content?.programs ?? [];
  const query = normalize(state.query);
  const filtered = programs.filter((program) => {
    const matchesFilter =
      state.activeFilter === "전체" || program.category === state.activeFilter;
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

  qs("#result-count").innerHTML = `총 <b>${filtered.length}</b>개의 교육 프로그램`;
  qs("#empty-state").hidden = filtered.length > 0;
  qs("#program-list").innerHTML = filtered
    .map(
      (program, index) => `
        <article class="program-card">
          <div class="program-card__category">
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
  const menuToggle = qs("#menu-toggle");
  const sidebar = qs("#sidebar");
  const backdrop = qs("#sidebar-backdrop");

  const setMenu = (open) => {
    sidebar.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-visible", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    document.body.style.overflow = open ? "hidden" : "";
  };

  menuToggle.addEventListener("click", () => setMenu(!sidebar.classList.contains("is-open")));
  backdrop.addEventListener("click", () => setMenu(false));
  qsa(".side-nav a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

  qs("#program-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderPrograms();
  });

  qs("#print-guide").addEventListener("click", () => window.print());

  const sections = qsa("main section[id]");
  const navLinks = qsa(".side-nav a");
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
    { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 0.5] },
  );
  sections.forEach((section) => observer.observe(section));
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

setupStaticEvents();
loadContent();
